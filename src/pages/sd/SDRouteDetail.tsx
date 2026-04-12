import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthProvider";
import { getRoute, optimiseRoute, updateRouteStopStatus } from "@/lib/api/sd";
import { toast } from "sonner";
import type { SDRoute, SDRouteStop } from "@/types/sd";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function stopColor(status: string): string {
  switch (status) {
    case "completed": return "hsl(var(--success))";
    case "arrived": return "hsl(var(--warning))";
    case "skipped": return "hsl(var(--muted-foreground))";
    default: return "hsl(var(--muted-foreground))";
  }
}

function stopBg(status: string): string {
  switch (status) {
    case "completed": return "#22c55e";
    case "arrived": return "#f59e0b";
    default: return "#9ca3af";
  }
}

export default function SDRouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sd.routes.manage");

  const [route, setRoute] = useState<SDRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimising, setIsOptimising] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getRoute(Number(id))
      .then(setRoute)
      .catch(() => {
        toast.error("Route not found");
        navigate("/sd/routes");
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  // Render map
  useEffect(() => {
    if (!route || !mapRef.current) return;

    // Clean up previous
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const stopsWithCoords = route.stops.filter(s => s.delivery_lat && s.delivery_lng);
    if (stopsWithCoords.length === 0) return;

    const map = L.map(mapRef.current).setView(
      [stopsWithCoords[0].delivery_lat!, stopsWithCoords[0].delivery_lng!],
      12
    );
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Add markers
    const latLngs: L.LatLngExpression[] = [];
    stopsWithCoords.forEach(stop => {
      const pos: L.LatLngExpression = [stop.delivery_lat!, stop.delivery_lng!];
      latLngs.push(pos);
      const bg = stopBg(stop.status);
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:${bg};color:white;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:13px;
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">${stop.sequence}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(pos, { icon }).addTo(map)
        .bindPopup(`<b>${stop.sequence}. ${stop.customer_name}</b><br/>${stop.delivery_address}`);
    });

    // Draw polyline
    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: "hsl(217, 91%, 60%)", weight: 3, opacity: 0.7, dashArray: "8 4" }).addTo(map);
    }

    // Fit bounds
    const bounds = L.latLngBounds(latLngs as L.LatLngExpression[]);
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [route]);

  const handleOptimise = async () => {
    if (!route) return;
    setIsOptimising(true);
    try {
      const optimised = await optimiseRoute(route.id);
      setRoute(optimised);
      toast.success("Route optimised by system");
    } catch {
      toast.error("Failed to optimise route");
    } finally {
      setIsOptimising(false);
    }
  };

  const handleStopStatus = async (stop: SDRouteStop, newStatus: "arrived" | "completed" | "skipped") => {
    if (!route) return;
    try {
      await updateRouteStopStatus(route.id, stop.id, newStatus);
      setRoute(prev => {
        if (!prev) return prev;
        const newStops = prev.stops.map(s =>
          s.id === stop.id ? { ...s, status: newStatus,
            ...(newStatus === "arrived" ? { arrived_at: new Date().toISOString() } : {}),
            ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
          } : s
        );
        const completedCount = newStops.filter(s => s.status === "completed").length;
        return { ...prev, stops: newStops, completed_stops: completedCount };
      });
      toast.success(`Stop marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update stop status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!route) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sd/routes")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">Route — {route.date}</h1>
          <StatusBadge status={route.status} />
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span>{route.driver_name}</span>
          <span>·</span>
          <span>{route.driver_vehicle}</span>
        </div>
      </div>

      {route.status === "draft" && canManage && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOptimise} disabled={isOptimising}>
          <Zap className="h-4 w-4" />
          {isOptimising ? "Optimising..." : "Optimise Route"}
        </Button>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stop list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Stops ({route.completed_stops} / {route.stop_count} completed)
          </h2>
          {route.stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stops on this route.</p>
          ) : (
            route.stops
              .sort((a, b) => a.sequence - b.sequence)
              .map(stop => (
                <Card key={stop.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: stopBg(stop.status) }}
                      >
                        {stop.sequence}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/sd/orders/${stop.order_id}`}
                            className="text-primary hover:underline font-medium text-sm"
                          >
                            {stop.order_no}
                          </Link>
                          <StatusBadge status={stop.status} />
                        </div>
                        <p className="text-sm font-medium">{stop.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{stop.delivery_address}</p>
                        {stop.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {new Date(stop.completed_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {stop.status === "pending" && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => handleStopStatus(stop, "arrived")}>
                              Mark Arrived
                            </Button>
                          )}
                          {stop.status === "arrived" && (
                            <>
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleStopStatus(stop, "completed")}>
                                Complete
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStopStatus(stop, "skipped")}>
                                Skip
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="rounded-lg border border-border bg-muted/30 min-h-[400px] lg:min-h-[500px]"
        />
      </div>
    </div>
  );
}
