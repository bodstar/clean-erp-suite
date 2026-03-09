import { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/providers/ThemeProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getMapPartners } from "@/lib/api/mpromo";
import type { MapPartner } from "@/types/mpromo";
import { MapFilterBar, type HeatMetric } from "@/components/mpromo/map/MapFilterBar";
import { MapPartnerPanel } from "@/components/mpromo/map/MapPartnerPanel";
import { useMapHeatLayer, getHeatMetricIntensityLabel } from "@/components/mpromo/map/useMapHeatLayer";

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
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iceWaterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MPromoMap() {
  const { theme } = useTheme();
  const { scopeMode, targetTeamId } = useMPromoScope();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());

  const [partners, setPartners] = useState<MapPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<MapPartner | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [heatmap, setHeatmap] = useState(false);
  const [heatMetric, setHeatMetric] = useState<HeatMetric>("redemptions");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  // Heatmap hook
  useMapHeatLayer({ map: mapRef.current, partners, heatmap, heatMetric });

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

  // Update markers
  useEffect(() => {
    markersRef.current.clearLayers();
    partners.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: p.type === "CHILLER" ? chillerIcon : iceWaterIcon,
        opacity: heatmap ? 0.5 : 1,
      });
      marker.bindTooltip(
        `<strong>${p.name}</strong><br/><span style="opacity:0.7">${p.location}</span>`,
        { direction: "top", offset: [0, -30], className: "leaflet-tooltip" }
      );
      marker.on("click", () => setSelectedPartner(p));
      markersRef.current.addLayer(marker);
    });
  }, [partners, heatmap]);

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
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div
          ref={mapContainerRef}
          className="rounded-lg border border-border overflow-hidden h-[500px] relative z-0"
        />
        <MapPartnerPanel partner={selectedPartner} />
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
