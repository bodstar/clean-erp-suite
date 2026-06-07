// @ts-nocheck
/**
 * routes-compute edge function
 *
 * Calls Google Routes API (computeRoutes) through the Lovable Google Maps connector
 * gateway. Used by the Route Create page to:
 *   - optimize the stop order
 *   - get the real road-following polyline
 *   - get total ETA + distance
 *
 * @module supabase/functions/routes-compute
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

interface LatLng { lat: number; lng: number }
interface RequestBody {
  origin: LatLng;
  stops: LatLng[];
  optimize?: boolean;
}

function isLatLng(v: unknown): v is LatLng {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as LatLng).lat === "number" &&
    typeof (v as LatLng).lng === "number"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Maps connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;
    if (!isLatLng(body?.origin) || !Array.isArray(body?.stops) || body.stops.length === 0) {
      return new Response(
        JSON.stringify({ error: "origin and at least one stop required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!body.stops.every(isLatLng)) {
      return new Response(
        JSON.stringify({ error: "all stops must have numeric lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Last stop is destination; everything before is an intermediate waypoint
    const destination = body.stops[body.stops.length - 1];
    const intermediates = body.stops.slice(0, -1).map((s) => ({
      location: { latLng: { latitude: s.lat, longitude: s.lng } },
    }));

    const reqBody = {
      origin: { location: { latLng: { latitude: body.origin.lat, longitude: body.origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      intermediates,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      optimizeWaypointOrder: Boolean(body.optimize) && intermediates.length > 0,
      polylineEncoding: "ENCODED_POLYLINE",
    };

    const fieldMask = [
      "routes.duration",
      "routes.distanceMeters",
      "routes.polyline.encodedPolyline",
      "routes.optimizedIntermediateWaypointIndex",
    ].join(",");

    const upstream = await fetch(
      `${GATEWAY_URL}/routes/directions/v2:computeRoutes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(reqBody),
      }
    );

    const data = await upstream.json();
    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "Routes API failed", status: upstream.status, details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data?.routes?.[0];
    if (!route) {
      return new Response(
        JSON.stringify({ error: "No route returned", details: data }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // duration is "1234s" → number
    const durationStr: string = route.duration ?? "0s";
    const duration_seconds = parseInt(String(durationStr).replace(/s$/, ""), 10) || 0;

    return new Response(
      JSON.stringify({
        duration_seconds,
        distance_meters: route.distanceMeters ?? 0,
        encoded_polyline: route.polyline?.encodedPolyline ?? "",
        optimized_indices: route.optimizedIntermediateWaypointIndex ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});