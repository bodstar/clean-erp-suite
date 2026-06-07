/**
 * Google Routes API client (via Lovable edge function).
 *
 * @module lib/api/googleRoutes
 */
import { supabase } from "@/integrations/supabase/client";

export interface LatLng { lat: number; lng: number }

export interface ComputeRouteResult {
  duration_seconds: number;
  distance_meters: number;
  encoded_polyline: string;
  /** New order of intermediate stops (excludes final destination) */
  optimized_indices: number[] | null;
}

/**
 * Call the routes-compute edge function.
 *
 * @param origin Driver / starting coordinate
 * @param stops Ordered list of stop coordinates (last entry treated as destination)
 * @param optimize Whether to let Google reorder intermediate stops
 */
export async function computeRoute(
  origin: LatLng,
  stops: LatLng[],
  optimize = false,
): Promise<ComputeRouteResult> {
  const { data, error } = await supabase.functions.invoke<ComputeRouteResult>(
    "routes-compute",
    { body: { origin, stops, optimize } },
  );
  if (error) throw error;
  if (!data) throw new Error("Empty response from routes-compute");
  return data;
}

/**
 * Decode a Google encoded polyline string into [lat, lng] tuples.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}