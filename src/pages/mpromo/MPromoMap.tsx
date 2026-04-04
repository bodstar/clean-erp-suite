import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/providers/ThemeProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getMapPartners } from "@/lib/api/mpromo";
import type { MapPartner } from "@/types/mpromo";
import { MapFilterBar, type HeatMetric, type HeatStyle } from "@/components/mpromo/map/MapFilterBar";
import { MapPartnerPanel } from "@/components/mpromo/map/MapPartnerPanel";
import { useMapHeatLayer, getHeatMetricIntensityLabel } from "@/components/mpromo/map/useMapHeatLayer";
import { useAdvancedAreaSelection } from "@/hooks/useAdvancedAreaSelection";
import { AdvancedAreaPanel } from "@/components/mpromo/map/AdvancedAreaPanel";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const chillerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
});

const iceWaterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
});

const selectedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
});

export default function MPromoMap() {
  const { theme } = useTheme();
  const { scopeMode, targetTeamId } = useMPromoScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPartnerId = searchParams.get("partner");
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());

  const [partners, setPartners] = useState<MapPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<MapPartner[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [heatmap, setHeatmap] = useState(false);
  const [heatMetric, setHeatMetric] = useState<HeatMetric>("redemptions");
  const [heatStyle, setHeatStyle] = useState<HeatStyle>("circles");
  const [areaSelect, setAreaSelect] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [advancedAreaSelect, setAdvancedAreaSelect] = useState(false);
  const handleAreaSelectChange = (value: boolean) => {
    setAreaSelect(value);
    if (value) setAdvancedAreaSelect(false);
    if (!value) setSelectedPartners([]);
  };
  const handleAdvancedAreaSelectChange = (value: boolean) => {
    setAdvancedAreaSelect(value);
    if (value) {
      setAreaSelect(false);
      setSelectedPartners([]);
    }
  };
  const [isComparing, setIsComparing] = useState(false);
  const [comparePartners, setComparePartners] = useState<MapPartner[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Advanced area selection hook
  const advancedSelection = useAdvancedAreaSelection({
    map: mapRef.current,
    partners,
    active: advancedAreaSelect,
  });

  // Drag selection refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<L.LatLng | null>(null);
  const selectionRectRef = useRef<L.Rectangle | null>(null);

  const isDark = theme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView([5.6037, -0.187], 12);
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(map);
    markersRef.current.addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) mapRef.current!.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(mapRef.current);
  }, [tileUrl]);

  // Circle click handler
  const handleCircleClick = useCallback((nearby: MapPartner[]) => {
    setSelectedPartners(nearby);
  }, []);

  const handleCompareStateChange = useCallback((comparing: boolean, partners: MapPartner[]) => {
    setIsComparing(comparing);
    setComparePartners(partners);
  }, []);

  // Heatmap hook
  useMapHeatLayer({ map: mapRef.current, partners, heatmap, heatMetric, heatStyle, onCircleClick: handleCircleClick });

  const loadPartners = useCallback(
    (bounds: L.LatLngBounds, zoom: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const data = await getMapPartners(
            {
              bbox: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
              zoom,
              type: typeFilter !== "all" ? typeFilter : undefined,
              status: statusFilter !== "all" ? statusFilter : undefined,
              search: search || undefined,
            },
            { mode: scopeMode, targetTeamId: scopeMode === "target" ? targetTeamId : null }
          );
          setPartners(data);
        } catch {
          setPartners([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [typeFilter, statusFilter, search, scopeMode, targetTeamId]
  );

  // Bind map events
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handler = () => loadPartners(map.getBounds(), map.getZoom());
    map.on("moveend", handler);
    map.on("zoomend", handler);
    handler();
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [loadPartners]);

  // Auto-select partner from query param
  useEffect(() => {
    if (!initialPartnerId || partners.length === 0) return;
    const pid = Number(initialPartnerId);
    const found = partners.find((p) => p.id === pid);
    if (found) {
      setSelectedPartners([found]);
      mapRef.current?.setView([found.latitude, found.longitude], 15);
      // Clear the query param so it doesn't re-trigger
      setSearchParams({}, { replace: true });
    }
  }, [initialPartnerId, partners]);

  const selectedKey = selectedPartners.map((p) => p.id).sort().join(",");
  const selectedIdSet = new Set(selectedPartners.map((p) => p.id));

  // Update markers — hide when heatmap is on (unless comparing)
  useEffect(() => {
    markersRef.current.clearLayers();
    
    // In compare mode, show only compared partners as markers
    if (isComparing && comparePartners.length >= 2) {
      comparePartners.forEach((p) => {
        const icon = p.type === "CHILLER" ? chillerIcon : iceWaterIcon;
        const marker = L.marker([p.latitude, p.longitude], { icon, zIndexOffset: 500 });
        marker.bindTooltip(
          `<strong>${p.name}</strong><br/><span style="opacity:0.7">${p.location}</span>`,
          { direction: "top", offset: [0, -30], className: "leaflet-tooltip" }
        );
        markersRef.current.addLayer(marker);
      });
      return;
    }
    
    if (!showMarkers) return; // markers controlled solely by the toggle
    partners.forEach((p) => {
      const isSelected = selectedIdSet.has(p.id);
      const icon = isSelected
        ? selectedIcon
        : p.type === "CHILLER"
          ? chillerIcon
          : iceWaterIcon;

      const marker = L.marker([p.latitude, p.longitude], { icon, zIndexOffset: isSelected ? 1000 : 0 });
      marker.bindTooltip(
        `<strong>${p.name}</strong><br/><span style="opacity:0.7">${p.location}</span>`,
        { direction: "top", offset: [0, -30], className: "leaflet-tooltip" }
      );
      marker.on("click", () => setSelectedPartners([p]));
      markersRef.current.addLayer(marker);
    });
  }, [partners, heatmap, areaSelect, showMarkers, selectedKey, isComparing, comparePartners]);

  // Drag-selection logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();

    if (!areaSelect) {
      // Clean up
      container.style.cursor = "";
      map.dragging.enable();
      if (selectionRectRef.current) {
        selectionRectRef.current.remove();
        selectionRectRef.current = null;
      }
      return;
    }

    container.style.cursor = "crosshair";
    map.dragging.disable();

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      isDraggingRef.current = true;
      dragStartRef.current = e.latlng;
      if (selectionRectRef.current) {
        selectionRectRef.current.remove();
        selectionRectRef.current = null;
      }
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const bounds = L.latLngBounds(dragStartRef.current, e.latlng);
      if (selectionRectRef.current) {
        selectionRectRef.current.setBounds(bounds);
      } else {
        selectionRectRef.current = L.rectangle(bounds, {
          color: "hsl(var(--primary))",
          weight: 2,
          fillOpacity: 0.15,
          dashArray: "6",
        }).addTo(map);
      }
    };

    const onMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      isDraggingRef.current = false;
      const bounds = L.latLngBounds(dragStartRef.current, e.latlng);
      dragStartRef.current = null;

      const inBounds = partners.filter((p) =>
        bounds.contains(L.latLng(p.latitude, p.longitude))
      );
      setSelectedPartners(inBounds);
      // Keep the rectangle visible on the map
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      container.style.cursor = "";
      map.dragging.enable();
      // Don't remove rectangle on cleanup — only remove when areaSelect is toggled off (handled above)
    };
  }, [areaSelect, partners]);

  return (
    <div className="space-y-4">
      <MapFilterBar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        heatmap={heatmap}
        onHeatmapChange={setHeatmap}
        heatMetric={heatMetric}
        onHeatMetricChange={setHeatMetric}
        heatStyle={heatStyle}
        onHeatStyleChange={setHeatStyle}
        isLoading={isLoading}
        areaSelect={areaSelect}
        onAreaSelectChange={handleAreaSelectChange}
        showMarkers={showMarkers}
        onShowMarkersChange={setShowMarkers}
        advancedAreaSelect={advancedAreaSelect}
        onAdvancedAreaSelectChange={handleAdvancedAreaSelectChange}
      />

      {advancedAreaSelect && (
        <AdvancedAreaPanel
          zones={advancedSelection.zones}
          activeZoneId={advancedSelection.activeZoneId}
          lockedZoneIds={advancedSelection.lockedZoneIds}
          dragEditingZoneId={advancedSelection.dragEditingZoneId}
          onAddZone={advancedSelection.addZone}
          onRemoveZone={advancedSelection.removeZone}
          onSetActiveZone={advancedSelection.setActiveZone}
          onSetShapeMode={advancedSelection.setShapeMode}
          onUpdateLabel={advancedSelection.updateZoneLabel}
          onUpdatePolygonPointCount={advancedSelection.updatePolygonPointCount}
          onUpdatePolygonEndMode={advancedSelection.updatePolygonEndMode}
          onClearAll={advancedSelection.clearAll}
          onUnlockZone={advancedSelection.unlockZone}
          onFinishDragEdit={advancedSelection.finishDragEdit}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div
          ref={mapContainerRef}
          className="rounded-lg border border-border overflow-hidden h-[500px] relative z-0"
        />
        <MapPartnerPanel
          partners={selectedPartners}
          heatmap={heatmap}
          areaSelect={areaSelect}
          onCompareStateChange={handleCompareStateChange}
          zones={advancedAreaSelect ? advancedSelection.zones : undefined}
        />
      </div>

      {heatmap && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Low</span>
          <div
            className="h-3 w-40 rounded-full"
            style={{
              background:
                "linear-gradient(to right, rgb(0,200,50), rgb(255,200,50), rgb(255,30,30))",
            }}
          />
          <span>High</span>
          <span className="ml-2 italic">
            {getHeatMetricIntensityLabel(heatMetric)} intensity
          </span>
        </div>
      )}
    </div>
  );
}
