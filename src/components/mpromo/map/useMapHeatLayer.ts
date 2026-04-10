/**
 * @module useMapHeatLayer
 * React hook that renders a heatmap overlay on a Leaflet map.
 *
 * Supports two visualization styles:
 * - **Circles**: colored circle markers sized proportionally to metric values
 * - **Smooth**: canvas-based density heatmap with configurable radius, blur, and opacity
 *
 * Metrics can be built-in (redemptions, orders, payouts, loyalty points) or
 * form-based (computed from Market Data submissions via the aggregation engine).
 * Form metrics use the composite key format: `form_metric:{formId}:{metricId}:{groupValue}`
 */

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import type { MapPartner } from "@/types/mpromo";
import type { HeatMetric, HeatStyle } from "./MapFilterBar";
import { getFormMetricHeatmapData, getFormHeatMetricOptions } from "@/lib/api/market-data";
import type { HeatmapMetricDef } from "@/types/market-data";

/** Map a normalized ratio (0–1) to a green→yellow→red color gradient */
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

/** Extract a numeric metric value from a partner, supporting both built-in and form-based metrics */
function getMetricValue(p: MapPartner, metric: HeatMetric, formMetricData?: Record<number, number>): number {
  if (metric.startsWith("form_metric:")) {
    return formMetricData?.[p.id] ?? 0;
  }
  switch (metric) {
    case "redemptions":
      return p.redemptions_amount;
    case "orders":
      return p.orders_amount;
    case "payouts":
      return p.pending_payouts_amount;
    case "loyalty_points":
      return p.loyalty_points;
    default:
      return 0;
  }
}

/** Get a human-readable label for a heatmap metric (used in tooltips) */
function getMetricLabel(
  metric: HeatMetric,
  cachedOptions: { formId: string; formName: string; metrics: HeatmapMetricDef[] }[]
): string {
  if (metric.startsWith("form_metric:")) {
    const parts = metric.split(":");
    const formId = parts[1];
    const metricId = parts[2];
    const form = cachedOptions.find((f) => f.formId === formId);
    const m = form?.metrics.find((m) => m.id === metricId);
    return m ? `${form!.formName}: ${m.name}` : "Market Data";
  }
  switch (metric) {
    case "redemptions":
      return "Redemptions";
    case "orders":
      return "Orders";
    case "payouts":
      return "Pending Payouts";
    case "loyalty_points":
      return "Loyalty Points";
    default:
      return metric;
  }
}

/** Get a short intensity label for the heatmap legend */
export function getHeatMetricIntensityLabel(
  metric: HeatMetric,
  cachedOptions?: { formId: string; formName: string; metrics: HeatmapMetricDef[] }[]
): string {
  if (metric.startsWith("form_metric:")) {
    const parts = metric.split(":");
    const formId = parts[1];
    const metricId = parts[2];
    const options = cachedOptions ?? [];
    const form = options.find((f) => f.formId === formId);
    const m = form?.metrics.find((m) => m.id === metricId);
    return m ? m.name : "Market Data";
  }
  switch (metric) {
    case "redemptions":
      return "Redemption";
    case "orders":
      return "Order";
    case "payouts":
      return "Payout";
    case "loyalty_points":
      return "Loyalty Points";
    default:
      return metric;
  }
}

/** Convert a circle marker's pixel radius to meters at its position */
function pixelRadiusToMeters(map: L.Map, center: L.LatLng, pixelRadius: number): number {
  const centerPoint = map.latLngToContainerPoint(center);
  const edgePoint = L.point(centerPoint.x + pixelRadius, centerPoint.y);
  const edgeLatLng = map.containerPointToLatLng(edgePoint);
  return center.distanceTo(edgeLatLng);
}

/**
 * Render a smooth density heatmap onto an HTML canvas using radial gradients.
 */
function drawSmoothHeatmap(
  map: L.Map,
  canvas: HTMLCanvasElement,
  data: { lat: number; lng: number; intensity: number }[],
  radius: number,
  blur: number,
  gradient: Record<number, string>
) {
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, size.x, size.y);

  data.forEach((d) => {
    const point = map.latLngToContainerPoint([d.lat, d.lng]);
    const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius + blur);
    grad.addColorStop(0, `rgba(0,0,0,${Math.min(d.intensity, 1)})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(point.x - radius - blur, point.y - radius - blur, (radius + blur) * 2, (radius + blur) * 2);
  });

  const paletteCanvas = document.createElement("canvas");
  paletteCanvas.width = 256;
  paletteCanvas.height = 1;
  const pCtx = paletteCanvas.getContext("2d")!;
  const pGrad = pCtx.createLinearGradient(0, 0, 256, 0);
  for (const [stop, color] of Object.entries(gradient)) {
    pGrad.addColorStop(Number(stop), color);
  }
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 256, 1);
  const palette = pCtx.getImageData(0, 0, 256, 1).data;

  const imageData = ctx.getImageData(0, 0, size.x, size.y);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha > 0) {
      const idx = alpha * 4;
      pixels[i] = palette[idx];
      pixels[i + 1] = palette[idx + 1];
      pixels[i + 2] = palette[idx + 2];
      pixels[i + 3] = Math.min(alpha * 2, 200);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

interface UseMapHeatLayerOptions {
  map: L.Map | null;
  partners: MapPartner[];
  heatmap: boolean;
  heatMetric: HeatMetric;
  heatStyle: HeatStyle;
  heatRadius: number;
  heatBlur: number;
  heatOpacity: number;
  onCircleClick?: (partners: MapPartner[]) => void;
}

/**
 * Hook that manages the heatmap visualization layer on the map.
 * Automatically re-renders when metric, style, or partner data changes.
 * Cleans up canvas and event listeners on unmount.
 */
export function useMapHeatLayer({ map, partners, heatmap, heatMetric, heatStyle, heatRadius, heatBlur, heatOpacity, onCircleClick }: UseMapHeatLayerOptions) {
  // Cache form metric options for label lookups
  const [formOptions, setFormOptions] = useState<{ formId: string; formName: string; metrics: HeatmapMetricDef[] }[]>([]);

  useEffect(() => {
    getFormHeatMetricOptions().then(setFormOptions);
  }, []);

  // Compute form metric data if needed
  const [formMetricData, setFormMetricData] = useState<Record<number, number> | undefined>(undefined);

  useEffect(() => {
    if (!heatMetric.startsWith("form_metric:")) {
      setFormMetricData(undefined);
      return;
    }
    const parts = heatMetric.split(":");
    const formId = parts[1];
    const metricId = parts[2];
    const groupValue = parts[3];
    getFormMetricHeatmapData(formId, metricId, groupValue).then(setFormMetricData);
  }, [heatMetric]);

  const circleLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moveHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!map) return;
    circleLayerRef.current.addTo(map);
    return () => {
      circleLayerRef.current.remove();
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      if (moveHandlerRef.current) {
        map.off("moveend", moveHandlerRef.current);
        map.off("zoomend", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    circleLayerRef.current.clearLayers();

    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }
    if (moveHandlerRef.current && map) {
      map.off("moveend", moveHandlerRef.current);
      map.off("zoomend", moveHandlerRef.current);
      moveHandlerRef.current = null;
    }

    if (!heatmap || partners.length === 0 || !map) return;

    const amounts = partners.map((p) => getMetricValue(p, heatMetric, formMetricData));
    const maxAmount = Math.max(...amounts, 1);

    if (heatStyle === "smooth") {
      const heatData = partners.map((p) => {
        const val = getMetricValue(p, heatMetric, formMetricData);
        const intensity = maxAmount > 0 ? val / maxAmount : 0;
        return { lat: p.latitude, lng: p.longitude, intensity };
      });

      const pane = map.getPane("overlayPane");
      if (!pane) return;

      const canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      canvas.className = "leaflet-zoom-hide";
      canvas.style.opacity = String(heatOpacity);
      pane.appendChild(canvas);
      canvasRef.current = canvas;

      const gradient = { 0.0: "green", 0.5: "yellow", 1.0: "red" };

      const redraw = () => {
        if (!canvasRef.current || !map) return;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        canvasRef.current.style.transform = `translate(${topLeft.x}px, ${topLeft.y}px)`;
        drawSmoothHeatmap(map, canvasRef.current, heatData, heatRadius, heatBlur, gradient);
      };

      redraw();
      moveHandlerRef.current = redraw;
      map.on("moveend", redraw);
      map.on("zoomend", redraw);
    } else {
      const label = getMetricLabel(heatMetric, formOptions);

      partners.forEach((p) => {
        const val = getMetricValue(p, heatMetric, formMetricData);
        const ratio = maxAmount > 0 ? val / maxAmount : 0;
        const radius = 8 + ratio * 32;
        const center = L.latLng(p.latitude, p.longitude);
        const circle = L.circleMarker([p.latitude, p.longitude], {
          radius,
          fillColor: getHeatColor(ratio),
          fillOpacity: 0.45 * heatOpacity,
          stroke: false,
        });
        const isFormMetric = heatMetric.startsWith("form_metric:");
        const formattedVal = (isFormMetric || heatMetric === "loyalty_points") ? val.toLocaleString() : `GH₵${val.toLocaleString()}`;
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
  }, [partners, heatmap, heatMetric, heatStyle, heatRadius, heatBlur, heatOpacity, map, onCircleClick, formMetricData, formOptions]);
}
