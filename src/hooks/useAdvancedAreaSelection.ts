import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import type { MapPartner } from "@/types/mpromo";
import type { AreaZone, ShapeMode, PolygonEndMode } from "@/types/area-zone";
import { ZONE_COLORS, ZONE_LABELS } from "@/types/area-zone";

interface UseAdvancedAreaSelectionProps {
  map: L.Map | null;
  partners: MapPartner[];
  active: boolean;
}

/** Ray-casting point-in-polygon check */
function pointInPolygon(lat: number, lng: number, polygon: L.LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function computePartnersInZone(zone: AreaZone, partners: MapPartner[]): MapPartner[] {
  if (!zone.layer) return [];

  if (zone.shapeMode === "rectangle") {
    const bounds = (zone.layer as L.Rectangle).getBounds();
    return partners.filter((p) => bounds.contains(L.latLng(p.latitude, p.longitude)));
  }

  if (zone.shapeMode === "circle") {
    const circle = zone.layer as L.Circle;
    const center = circle.getLatLng();
    const radius = circle.getRadius();
    return partners.filter((p) => center.distanceTo(L.latLng(p.latitude, p.longitude)) <= radius);
  }

  if (zone.shapeMode === "polygon") {
    const latlngs = (zone.layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
    return partners.filter((p) => pointInPolygon(p.latitude, p.longitude, latlngs));
  }

  return [];
}

export function useAdvancedAreaSelection({ map, partners, active }: UseAdvancedAreaSelectionProps) {
  const [zones, setZones] = useState<AreaZone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  // Drawing state refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<L.LatLng | null>(null);
  const previewLayerRef = useRef<L.Layer | null>(null);
  const circleStartRef = useRef<L.LatLng | null>(null);
  const circleDotRef = useRef<L.CircleMarker | null>(null);
  const polyVerticesRef = useRef<L.LatLng[]>([]);
  const polyMarkersRef = useRef<L.Layer[]>([]);
  const polyPreviewLineRef = useRef<L.Polyline | null>(null);

  const layerGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Add layer group to map
  useEffect(() => {
    if (!map) return;
    layerGroupRef.current.addTo(map);
    return () => {
      layerGroupRef.current.remove();
    };
  }, [map]);

  const getActiveZone = useCallback(() => {
    return zones.find((z) => z.id === activeZoneId) ?? null;
  }, [zones, activeZoneId]);

  const recomputePartners = useCallback(
    (updatedZones: AreaZone[]): AreaZone[] => {
      return updatedZones.map((z) => ({
        ...z,
        partners: computePartnersInZone(z, partners),
      }));
    },
    [partners]
  );

  // Recompute partners when partners array changes
  useEffect(() => {
    setZones((prev) => recomputePartners(prev));
  }, [partners]);

  const addZone = useCallback(() => {
    const index = zones.length % ZONE_COLORS.length;
    const id = crypto.randomUUID();
    const newZone: AreaZone = {
      id,
      label: ZONE_LABELS[zones.length % ZONE_LABELS.length],
      color: ZONE_COLORS[index],
      shapeMode: "rectangle",
      layer: null,
      drawingLayers: [],
      partners: [],
      polygonPointCount: 4,
    };
    setZones((prev) => [...prev, newZone]);
    setActiveZoneId(id);
  }, [zones.length]);

  const updatePolygonPointCount = useCallback((id: string, count: number) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, polygonPointCount: Math.max(3, count) } : z)));
  }, []);

  const removeZone = useCallback(
    (id: string) => {
      setZones((prev) => {
        const zone = prev.find((z) => z.id === id);
        if (zone) {
          if (zone.layer) layerGroupRef.current.removeLayer(zone.layer as L.Layer);
          zone.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
        }
        return prev.filter((z) => z.id !== id);
      });
      if (activeZoneId === id) setActiveZoneId(null);
    },
    [activeZoneId]
  );

  const setShapeMode = useCallback(
    (id: string, mode: ShapeMode) => {
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== id) return z;
          // Clear existing shape
          if (z.layer) layerGroupRef.current.removeLayer(z.layer as L.Layer);
          z.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
          return { ...z, shapeMode: mode, layer: null, drawingLayers: [], partners: [] };
        })
      );
    },
    []
  );

  const updateZoneLabel = useCallback((id: string, label: string) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, label } : z)));
  }, []);

  const clearAll = useCallback(() => {
    zones.forEach((z) => {
      if (z.layer) layerGroupRef.current.removeLayer(z.layer as L.Layer);
      z.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
    });
    setZones([]);
    setActiveZoneId(null);
  }, [zones]);

  // Clear drawing artifacts helper
  const clearDrawingState = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    if (previewLayerRef.current && map) {
      layerGroupRef.current.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }
    if (circleDotRef.current && map) {
      layerGroupRef.current.removeLayer(circleDotRef.current);
      circleDotRef.current = null;
    }
    circleStartRef.current = null;
    polyVerticesRef.current = [];
    polyMarkersRef.current.forEach((l) => layerGroupRef.current.removeLayer(l));
    polyMarkersRef.current = [];
    if (polyPreviewLineRef.current) {
      layerGroupRef.current.removeLayer(polyPreviewLineRef.current);
      polyPreviewLineRef.current = null;
    }
  }, [map]);

  // Finalize shape into zone
  const finalizeShape = useCallback(
    (layer: L.Layer, drawingLayers: L.Layer[] = []) => {
      if (!activeZoneId) return;
      setZones((prev) =>
        recomputePartners(
          prev.map((z) => {
            if (z.id !== activeZoneId) return z;
            // Remove old shape if redrawing
            if (z.layer) layerGroupRef.current.removeLayer(z.layer as L.Layer);
            z.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
            return { ...z, layer, drawingLayers };
          })
        )
      );
    },
    [activeZoneId, recomputePartners]
  );

  // Main drawing effect
  useEffect(() => {
    if (!map || !active || !activeZoneId) return;

    const zone = zones.find((z) => z.id === activeZoneId);
    if (!zone) return;

    const container = map.getContainer();
    container.style.cursor = "crosshair";
    map.dragging.disable();

    const color = zone.color;

    if (zone.shapeMode === "rectangle") {
      const onMouseDown = (e: L.LeafletMouseEvent) => {
        isDraggingRef.current = true;
        dragStartRef.current = e.latlng;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDraggingRef.current || !dragStartRef.current) return;
        const bounds = L.latLngBounds(dragStartRef.current, e.latlng);
        if (previewLayerRef.current) {
          (previewLayerRef.current as L.Rectangle).setBounds(bounds);
        } else {
          previewLayerRef.current = L.rectangle(bounds, {
            color,
            weight: 2,
            fillOpacity: 0.15,
            fillColor: color,
            dashArray: "6",
          });
          layerGroupRef.current.addLayer(previewLayerRef.current);
        }
      };

      const onMouseUp = () => {
        if (!isDraggingRef.current || !dragStartRef.current) return;
        isDraggingRef.current = false;
        if (previewLayerRef.current) {
          finalizeShape(previewLayerRef.current);
          previewLayerRef.current = null;
        }
        dragStartRef.current = null;
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
      };
    }

    if (zone.shapeMode === "circle") {
      const onClick = (e: L.LeafletMouseEvent) => {
        if (!circleStartRef.current) {
          // First click — set center
          circleStartRef.current = e.latlng;
          circleDotRef.current = L.circleMarker(e.latlng, {
            radius: 4,
            color,
            fillColor: color,
            fillOpacity: 1,
          });
          layerGroupRef.current.addLayer(circleDotRef.current);
        } else {
          // Second click — finalize
          const radius = circleStartRef.current.distanceTo(e.latlng);
          const circle = L.circle(circleStartRef.current, {
            radius,
            color,
            weight: 2,
            fillOpacity: 0.15,
            fillColor: color,
            dashArray: "6",
          });
          layerGroupRef.current.addLayer(circle);

          // Cleanup preview
          if (previewLayerRef.current) {
            layerGroupRef.current.removeLayer(previewLayerRef.current);
            previewLayerRef.current = null;
          }
          if (circleDotRef.current) {
            layerGroupRef.current.removeLayer(circleDotRef.current);
            circleDotRef.current = null;
          }

          finalizeShape(circle);
          circleStartRef.current = null;
        }
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!circleStartRef.current) return;
        const radius = circleStartRef.current.distanceTo(e.latlng);
        if (previewLayerRef.current) {
          (previewLayerRef.current as L.Circle).setRadius(radius);
        } else {
          previewLayerRef.current = L.circle(circleStartRef.current, {
            radius,
            color,
            weight: 1,
            fillOpacity: 0.08,
            fillColor: color,
            dashArray: "4",
          });
          layerGroupRef.current.addLayer(previewLayerRef.current);
        }
      };

      map.on("click", onClick);
      map.on("mousemove", onMouseMove);

      return () => {
        map.off("click", onClick);
        map.off("mousemove", onMouseMove);
        container.style.cursor = "";
        map.dragging.enable();
      };
    }

    if (zone.shapeMode === "polygon") {
      const targetCount = zone.polygonPointCount;

      const finalizePoly = () => {
        if (polyVerticesRef.current.length < 3) return;

        const polygon = L.polygon(polyVerticesRef.current, {
          color,
          weight: 2,
          fillOpacity: 0.15,
          fillColor: color,
        });
        layerGroupRef.current.addLayer(polygon);

        const savedMarkers = [...polyMarkersRef.current];

        if (polyPreviewLineRef.current) {
          layerGroupRef.current.removeLayer(polyPreviewLineRef.current);
          polyPreviewLineRef.current = null;
        }

        finalizeShape(polygon, savedMarkers);
        polyVerticesRef.current = [];
        polyMarkersRef.current = [];
      };

      const onClick = (e: L.LeafletMouseEvent) => {
        polyVerticesRef.current.push(e.latlng);
        const idx = polyVerticesRef.current.length;

        const marker = L.circleMarker(e.latlng, {
          radius: 6,
          color,
          fillColor: color,
          fillOpacity: 1,
        }).bindTooltip(`${idx}/${targetCount}`, {
          permanent: true,
          direction: "center",
          className: "leaflet-tooltip-polygon-vertex",
        });
        layerGroupRef.current.addLayer(marker);
        polyMarkersRef.current.push(marker);

        if (polyPreviewLineRef.current) {
          polyPreviewLineRef.current.setLatLngs(polyVerticesRef.current);
        } else {
          polyPreviewLineRef.current = L.polyline(polyVerticesRef.current, {
            color,
            weight: 2,
            dashArray: "6",
          });
          layerGroupRef.current.addLayer(polyPreviewLineRef.current);
        }

        // Auto-finalize when target point count reached
        if (idx >= targetCount) {
          finalizePoly();
        }
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (polyVerticesRef.current.length === 0 || !polyPreviewLineRef.current) return;
        polyPreviewLineRef.current.setLatLngs([...polyVerticesRef.current, e.latlng]);
      };

      map.on("click", onClick);
      map.on("mousemove", onMouseMove);

      return () => {
        map.off("click", onClick);
        map.off("mousemove", onMouseMove);
        container.style.cursor = "";
        map.dragging.enable();
      };
    }

    return () => {
      container.style.cursor = "";
      map.dragging.enable();
    };
  }, [map, active, activeZoneId, zones, finalizeShape]);

  // When deactivated, re-enable map dragging but keep zones visible
  useEffect(() => {
    if (!map) return;
    if (!active) {
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      clearDrawingState();
    }
  }, [active, map, clearDrawingState]);

  return {
    zones,
    activeZoneId,
    addZone,
    removeZone,
    setActiveZone: setActiveZoneId,
    setShapeMode,
    updateZoneLabel,
    updatePolygonPointCount,
    clearAll,
  };
}
