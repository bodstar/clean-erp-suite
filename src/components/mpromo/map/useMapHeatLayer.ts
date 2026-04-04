import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import type { MapPartner } from "@/types/mpromo";
import type { HeatMetric, HeatStyle } from "./MapFilterBar";

function getHeatColor(ratio: number): string {
  if (ratio < 0.5) {
    const g = Math.round(200 - ratio * 2 * 100);
    const r = Math.round(ratio * 2 * 255);
    return `rgb(${r}, ${g}, 50)`;
  }
  const r = 255;
  const g = Math.round(200 - (ratio - 0.5) * 2 * 200);
  return `rgb(${r}, ${g}, 30)`;
}

function getMetricValue(p: MapPartner, metric: HeatMetric): number {
  switch (metric) {
    case "redemptions":
      return p.redemptions_amount;
    case "orders":
      return p.orders_amount;
    case "payouts":
      return p.pending_payouts_amount;
    case "loyalty_points":
      return p.loyalty_points;
  }
}

function getMetricLabel(metric: HeatMetric): string {
  switch (metric) {
    case "redemptions":
      return "Redemptions";
    case "orders":
      return "Orders";
    case "payouts":
      return "Pending Payouts";
    case "loyalty_points":
      return "Loyalty Points";
  }
}

export function getHeatMetricIntensityLabel(metric: HeatMetric): string {
  switch (metric) {
    case "redemptions":
      return "Redemption";
    case "orders":
      return "Order";
    case "payouts":
      return "Payout";
    case "loyalty_points":
      return "Loyalty Points";
  }
}

/** Convert a circle marker's pixel radius to meters at its position */
function pixelRadiusToMeters(map: L.Map, center: L.LatLng, pixelRadius: number): number {
  const centerPoint = map.latLngToContainerPoint(center);
  const edgePoint = L.point(centerPoint.x + pixelRadius, centerPoint.y);
  const edgeLatLng = map.containerPointToLatLng(edgePoint);
  return center.distanceTo(edgeLatLng);
}

interface UseMapHeatLayerOptions {
  map: L.Map | null;
  partners: MapPartner[];
  heatmap: boolean;
  heatMetric: HeatMetric;
  heatStyle: HeatStyle;
  onCircleClick?: (partners: MapPartner[]) => void;
}

export function useMapHeatLayer({ map, partners, heatmap, heatMetric, heatStyle, onCircleClick }: UseMapHeatLayerOptions) {
  const circleLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const smoothLayerRef = useRef<L.Layer | null>(null);

  // Add circle layer group to map once
  useEffect(() => {
    if (!map) return;
    circleLayerRef.current.addTo(map);
    return () => {
      circleLayerRef.current.remove();
      if (smoothLayerRef.current) {
        map.removeLayer(smoothLayerRef.current);
        smoothLayerRef.current = null;
      }
    };
  }, [map]);

  // Render heat visualization
  useEffect(() => {
    // Clear both layers
    circleLayerRef.current.clearLayers();
    if (smoothLayerRef.current && map) {
      map.removeLayer(smoothLayerRef.current);
      smoothLayerRef.current = null;
    }

    if (!heatmap || partners.length === 0 || !map) return;

    const amounts = partners.map((p) => getMetricValue(p, heatMetric));
    const maxAmount = Math.max(...amounts, 1);

    if (heatStyle === "smooth") {
      // Use leaflet.heat smooth density heatmap
      const heatData: [number, number, number][] = partners.map((p) => {
        const val = getMetricValue(p, heatMetric);
        const intensity = maxAmount > 0 ? val / maxAmount : 0;
        return [p.latitude, p.longitude, intensity];
      });

      console.log("[HeatLayer] smooth mode, data points:", heatData.length, "heatLayer exists:", typeof (L as any).heatLayer);

      if (typeof (L as any).heatLayer === "function") {
        smoothLayerRef.current = (L as any).heatLayer(heatData, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          max: 1,
          gradient: {
            0.0: "green",
            0.5: "yellow",
            1.0: "red",
          },
        }).addTo(map);
        console.log("[HeatLayer] smooth layer added to map");
      } else {
        console.error("[HeatLayer] L.heatLayer is not available — leaflet.heat may not be loaded");
      }
    } else {
      // Circle marker approach
      const label = getMetricLabel(heatMetric);

      partners.forEach((p) => {
        const val = getMetricValue(p, heatMetric);
        const ratio = maxAmount > 0 ? val / maxAmount : 0;
        const radius = 8 + ratio * 32;
        const center = L.latLng(p.latitude, p.longitude);
        const circle = L.circleMarker([p.latitude, p.longitude], {
          radius,
          fillColor: getHeatColor(ratio),
          fillOpacity: 0.45,
          stroke: false,
        });
        const formattedVal = heatMetric === "loyalty_points" ? val.toLocaleString() : `GH₵${val.toLocaleString()}`;
        circle.bindTooltip(
          `<strong>${p.name}</strong><br/>${label}: ${formattedVal}`,
          { direction: "top" }
        );

        circle.on("click", () => {
          if (!onCircleClick || !map) return;
          const metersRadius = pixelRadiusToMeters(map, center, radius);
          const nearby = partners.filter((other) => {
            const otherLatLng = L.latLng(other.latitude, other.longitude);
            return center.distanceTo(otherLatLng) <= metersRadius;
          });
          onCircleClick(nearby);
        });

        circleLayerRef.current.addLayer(circle);
      });
    }
  }, [partners, heatmap, heatMetric, heatStyle, map, onCircleClick]);
}
