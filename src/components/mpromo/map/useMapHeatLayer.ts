import { useEffect, useRef } from "react";
import L from "leaflet";
import type { MapPartner } from "@/types/mpromo";
import type { HeatMetric } from "./MapFilterBar";

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

interface UseMapHeatLayerOptions {
  map: L.Map | null;
  partners: MapPartner[];
  heatmap: boolean;
  heatMetric: HeatMetric;
}

export function useMapHeatLayer({ map, partners, heatmap, heatMetric }: UseMapHeatLayerOptions) {
  const heatLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Add layer to map once
  useEffect(() => {
    if (!map) return;
    heatLayerRef.current.addTo(map);
    return () => {
      heatLayerRef.current.remove();
    };
  }, [map]);

  // Render heat circles
  useEffect(() => {
    heatLayerRef.current.clearLayers();
    if (!heatmap || partners.length === 0) return;

    const label = getMetricLabel(heatMetric);
    const amounts = partners.map((p) => getMetricValue(p, heatMetric));
    const maxAmount = Math.max(...amounts, 1);

    partners.forEach((p) => {
      const val = getMetricValue(p, heatMetric);
      const ratio = maxAmount > 0 ? val / maxAmount : 0;
      const radius = 8 + ratio * 32;
      const circle = L.circleMarker([p.latitude, p.longitude], {
        radius,
        fillColor: getHeatColor(ratio),
        fillOpacity: 0.45,
        stroke: false,
      });
      circle.bindTooltip(
        `<strong>${p.name}</strong><br/>${label}: GH₵${val.toLocaleString()}`,
        { direction: "top" }
      );
      heatLayerRef.current.addLayer(circle);
    });
  }, [partners, heatmap, heatMetric]);
}
