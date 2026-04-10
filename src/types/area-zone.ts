/**
 * @module AreaZoneTypes
 * Type definitions for the Advanced Area Selection system on the map.
 * Supports multi-zone selection with rectangle, circle, and polygon shapes,
 * including polygon vertex editing and partner containment detection.
 */

import type { MapPartner } from "@/types/mpromo";
import L from "leaflet";

/** Drawing tool used to define a zone's boundary */
export type ShapeMode = "rectangle" | "circle" | "polygon";

/** How polygon drawing terminates */
export type PolygonEndMode = "count" | "doubleclick";

/** How an existing polygon is edited after initial creation */
export type PolygonEditMode = "drag" | "redraw";

/**
 * Represents a named selection zone on the map.
 * Each zone has a shape, color, and a list of partners
 * whose coordinates fall within its boundary.
 */
export interface AreaZone {
  id: string;
  label: string;
  color: string;
  shapeMode: ShapeMode;
  /** The Leaflet layer representing the drawn shape (null while drawing) */
  layer: L.Layer | null;
  /** Temporary drawing artifacts (vertex markers, preview lines) */
  drawingLayers: L.Layer[];
  /** Partners whose coordinates fall within this zone */
  partners: MapPartner[];
  /** Number of vertices to place before auto-closing polygon (count mode) */
  polygonPointCount: number;
  /** How polygon drawing terminates */
  polygonEndMode: PolygonEndMode;
}

/** Predefined color palette for zone differentiation (up to 10 zones) */
export const ZONE_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#0ea5e9", // sky
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
] as const;

/** Default labels assigned to zones in order */
export const ZONE_LABELS = [
  "Zone A", "Zone B", "Zone C", "Zone D", "Zone E",
  "Zone F", "Zone G", "Zone H", "Zone I", "Zone J",
] as const;
