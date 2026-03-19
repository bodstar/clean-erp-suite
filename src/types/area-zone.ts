import type { MapPartner } from "@/types/mpromo";
import L from "leaflet";

export type ShapeMode = "rectangle" | "circle" | "polygon";

export interface AreaZone {
  id: string;
  label: string;
  color: string;
  shapeMode: ShapeMode;
  layer: L.Layer | null;
  /** Temporary drawing artifacts (vertex markers, preview lines) */
  drawingLayers: L.Layer[];
  partners: MapPartner[];
  /** Number of vertices to place before auto-closing polygon */
  polygonPointCount: number;
}

export const ZONE_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

export const ZONE_LABELS = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"] as const;
