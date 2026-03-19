import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import type { MapPartner } from "@/types/mpromo";
import type { AreaZone, ShapeMode, PolygonEndMode, PolygonEditMode } from "@/types/area-zone";
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
  const [lockedZoneIds, setLockedZoneIds] = useState<Set<string>>(new Set());
  const [dragEditingZoneId, setDragEditingZoneId] = useState<string | null>(null);

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
      polygonEndMode: "count",
    };
    setZones((prev) => [...prev, newZone]);
    setActiveZoneId(id);
  }, [zones.length]);

  const updatePolygonPointCount = useCallback((id: string, count: number) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, polygonPointCount: Math.max(3, count) } : z)));
  }, []);

  const updatePolygonEndMode = useCallback((id: string, mode: PolygonEndMode) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, polygonEndMode: mode } : z)));
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
      setLockedZoneIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
    setLockedZoneIds(new Set());
  }, [zones]);

  // Draggable node refs for polygon editing
  const dragNodeMarkersRef = useRef<L.CircleMarker[]>([]);

  const clearDragNodes = useCallback(() => {
    dragNodeMarkersRef.current.forEach((m) => layerGroupRef.current.removeLayer(m));
    dragNodeMarkersRef.current = [];
  }, []);

  const unlockZone = useCallback((id: string, editMode?: PolygonEditMode) => {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return;

    if (zone.shapeMode === "polygon" && editMode === "drag" && zone.layer) {
      // Drag mode: keep shape, add draggable vertex markers
      setLockedZoneIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDragEditingZoneId(id);
      // Instead, add draggable markers on each vertex
      const polygon = zone.layer as L.Polygon;
      const latlngs = (polygon.getLatLngs()[0] as L.LatLng[]).slice();
      
      clearDragNodes();
      
      latlngs.forEach((ll, i) => {
        const marker = L.circleMarker(ll, {
          radius: 8,
          color: zone.color,
          fillColor: "#fff",
          fillOpacity: 1,
          weight: 2,
          interactive: true,
          bubblingMouseEvents: false,
        } as L.CircleMarkerOptions);
        
        marker.bindTooltip(`${i + 1}`, {
          permanent: true,
          direction: "center",
          className: "leaflet-tooltip-polygon-vertex",
        });

        // Make draggable by handling map events
        let isDragging = false;
        
        marker.on("mousedown", (e: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(e as unknown as Event);
          isDragging = true;
          map?.dragging.disable();
        });

        const onMouseMove = (e: L.LeafletMouseEvent) => {
          if (!isDragging) return;
          marker.setLatLng(e.latlng);
          latlngs[i] = e.latlng;
          polygon.setLatLngs(latlngs);
        };

        const onMouseUp = () => {
          if (!isDragging) return;
          isDragging = false;
          map?.dragging.enable();
          // Recompute partners after drag
          setZones((prev) => recomputePartners(prev));
        };

        map?.on("mousemove", onMouseMove);
        map?.on("mouseup", onMouseUp);
        
        // Store cleanup refs on marker
        (marker as any)._dragCleanup = () => {
          map?.off("mousemove", onMouseMove);
          map?.off("mouseup", onMouseUp);
        };

        layerGroupRef.current.addLayer(marker);
        dragNodeMarkersRef.current.push(marker);
      });
      
      return;
    }

    // Default: redraw mode (or non-polygon shapes)
    if (zone.shapeMode === "polygon" && editMode === "redraw" && zone.layer) {
      // Clear existing shape for redraw
      layerGroupRef.current.removeLayer(zone.layer as L.Layer);
      zone.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
      setZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, layer: null, drawingLayers: [], partners: [] } : z))
      );
    }

    setLockedZoneIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setActiveZoneId(id);
  }, [zones, map, clearDragNodes, recomputePartners]);

  /** Finish drag-editing and re-lock the zone */
  const finishDragEdit = useCallback((id: string) => {
    // Clean up drag node markers
    dragNodeMarkersRef.current.forEach((m) => {
      (m as any)._dragCleanup?.();
      layerGroupRef.current.removeLayer(m);
    });
    dragNodeMarkersRef.current = [];

    // Remove old drawing layers (original vertex markers) from the zone
    setZones((prev) =>
      recomputePartners(
        prev.map((z) => {
          if (z.id !== id) return z;
          z.drawingLayers.forEach((l) => layerGroupRef.current.removeLayer(l));
          return { ...z, drawingLayers: [] };
        })
      )
    );

    // Re-lock
    setLockedZoneIds((prev) => new Set(prev).add(id));
    setDragEditingZoneId(null);
  }, [recomputePartners]);

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
      // Lock the zone after drawing is finalized
      setLockedZoneIds((prev) => new Set(prev).add(activeZoneId));
      setActiveZoneId(null);
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

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          isDraggingRef.current = false;
          dragStartRef.current = null;
          if (previewLayerRef.current) {
            layerGroupRef.current.removeLayer(previewLayerRef.current);
            previewLayerRef.current = null;
          }
        }
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
      document.addEventListener("keydown", onKeyDown);

      return () => {
        map.off("mousedown", onMouseDown);
        map.off("mousemove", onMouseMove);
        map.off("mouseup", onMouseUp);
        document.removeEventListener("keydown", onKeyDown);
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

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          circleStartRef.current = null;
          if (previewLayerRef.current) {
            layerGroupRef.current.removeLayer(previewLayerRef.current);
            previewLayerRef.current = null;
          }
          if (circleDotRef.current) {
            layerGroupRef.current.removeLayer(circleDotRef.current);
            circleDotRef.current = null;
          }
        }
      };

      map.on("click", onClick);
      map.on("mousemove", onMouseMove);
      document.addEventListener("keydown", onKeyDown);

      return () => {
        map.off("click", onClick);
        map.off("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
        container.style.cursor = "";
        map.dragging.enable();
      };
    }

    if (zone.shapeMode === "polygon") {
      const useCount = zone.polygonEndMode === "count";
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

        const tooltipText = useCount ? `${idx}/${targetCount}` : `${idx}`;
        const marker = L.circleMarker(e.latlng, {
          radius: 6,
          color,
          fillColor: color,
          fillOpacity: 1,
        }).bindTooltip(tooltipText, {
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

        // Auto-finalize when target point count reached (count mode only)
        if (useCount && idx >= targetCount) {
          finalizePoly();
        }
      };

      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let progressEl: HTMLDivElement | null = null;

      const removeProgress = () => {
        if (progressEl) {
          progressEl.remove();
          progressEl = null;
        }
      };

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        if (useCount || polyVerticesRef.current.length < 3) return;

        // Create visual progress ring at click position
        const point = map!.latLngToContainerPoint(e.latlng);
        progressEl = document.createElement("div");
        progressEl.className = "longpress-progress-ring";
        progressEl.style.left = `${point.x}px`;
        progressEl.style.top = `${point.y}px`;
        container.appendChild(progressEl);

        longPressTimer = setTimeout(() => {
          longPressTimer = null;
          removeProgress();
          finalizePoly();
        }, 3000);
      };

      const onMouseUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        removeProgress();
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (polyVerticesRef.current.length === 0 || !polyPreviewLineRef.current) return;
        polyPreviewLineRef.current.setLatLngs([...polyVerticesRef.current, e.latlng]);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && polyVerticesRef.current.length > 0) {
          polyMarkersRef.current.forEach((l) => layerGroupRef.current.removeLayer(l));
          polyMarkersRef.current = [];
          polyVerticesRef.current = [];
          if (polyPreviewLineRef.current) {
            layerGroupRef.current.removeLayer(polyPreviewLineRef.current);
            polyPreviewLineRef.current = null;
          }
        }
      };

      map.on("click", onClick);
      map.on("mousedown", onMouseDown);
      map.on("mouseup", onMouseUp);
      map.on("mousemove", onMouseMove);
      document.addEventListener("keydown", onKeyDown);

      return () => {
        if (longPressTimer) clearTimeout(longPressTimer);
        removeProgress();
        map.off("click", onClick);
        map.off("mousedown", onMouseDown);
        map.off("mouseup", onMouseUp);
        map.off("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
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
    lockedZoneIds,
    dragEditingZoneId,
    addZone,
    removeZone,
    setActiveZone: setActiveZoneId,
    setShapeMode,
    updateZoneLabel,
    updatePolygonPointCount,
    updatePolygonEndMode,
    clearAll,
    unlockZone,
    finishDragEdit,
  };
}
