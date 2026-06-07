import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, X, ArrowLeft, Sparkles, Loader2, Clock, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSDScope } from "@/providers/SDScopeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getDrivers, getSDOrders, createRoute } from "@/lib/api/sd";
import { toast } from "sonner";
import RouteCreateMap from "@/components/sd/RouteCreateMap";
import type { SDDriver, SDOrderSummary } from "@/types/sd";
import { computeRoute } from "@/lib/api/googleRoutes";

interface StopEntry {
  order_id: number;
  order_no: string;
  customer_name: string;
  delivery_address: string;
}

export default function SDRouteCreate() {
  const navigate = useNavigate();
  const { scope } = useSDScope();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sd.routes.manage");

  const [step, setStep] = useState(1);
  const [availableDrivers, setAvailableDrivers] = useState<SDDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmedOrders, setConfirmedOrders] = useState<SDOrderSummary[]>([]);
  const [stops, setStops] = useState<StopEntry[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Google Routes API result
  const [routePolyline, setRoutePolyline] = useState<string>("");
  const [routeDurationSec, setRouteDurationSec] = useState<number | null>(null);
  const [routeDistanceM, setRouteDistanceM] = useState<number | null>(null);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [driversRes, ordersRes] = await Promise.all([
          getDrivers({ status: "available" }, scope),
          getSDOrders({ status: "confirmed" }, scope),
        ]);
        setAvailableDrivers(driversRes.data);
        setConfirmedOrders(ordersRes.data);
      } catch {
        toast.error("Failed to load data for route creation");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [scope]);

  const addStop = (order: SDOrderSummary) => {
    if (stops.some(s => s.order_id === order.id)) return;
    setStops(prev => [...prev, {
      order_id: order.id,
      order_no: order.order_no,
      customer_name: order.partner_name || order.unregistered_customer_name || "—",
      delivery_address: order.delivery_address,
    }]);
  };

  const removeStop = (orderId: number) => {
    setStops(prev => prev.filter(s => s.order_id !== orderId));
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const arr = [...stops];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setStops(arr);
  };

  const handleCreateRoute = async () => {
    setIsSubmitting(true);
    try {
      const route = await createRoute({
        driver_id: Number(selectedDriverId),
        date: routeDate,
        stops: stops.map((s, i) => ({ order_id: s.order_id, sequence: i + 1 })),
      }, scope);
      toast.success("Route created");
      navigate(`/sd/routes/${route.id}`);
    } catch {
      toast.error("Failed to create route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = confirmedOrders.filter(o => {
    if (stops.some(s => s.order_id === o.id)) return false;
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return o.order_no.toLowerCase().includes(q) ||
      (o.partner_name ?? "").toLowerCase().includes(q) ||
      (o.unregistered_customer_name ?? "").toLowerCase().includes(q);
  });

  const selectedDriverObj = availableDrivers.find(d => d.id === Number(selectedDriverId));

  /**
   * Build coord list (driver origin + stops) and call Routes API.
   * If optimize=true, reorder local `stops` state to match Google's optimal order.
   */
  const runCompute = useCallback(async (optimize: boolean) => {
    if (!selectedDriverObj?.current_lat || !selectedDriverObj?.current_lng) return;
    const stopCoords = stops
      .map(s => {
        const o = confirmedOrders.find(co => co.id === s.order_id);
        return o?.delivery_lat && o?.delivery_lng
          ? { order_id: s.order_id, lat: o.delivery_lat, lng: o.delivery_lng }
          : null;
      })
      .filter((v): v is { order_id: number; lat: number; lng: number } => v !== null);
    if (stopCoords.length < 1) return;

    optimize ? setIsOptimizing(true) : setIsComputingRoute(true);
    try {
      const res = await computeRoute(
        { lat: selectedDriverObj.current_lat, lng: selectedDriverObj.current_lng },
        stopCoords.map(s => ({ lat: s.lat, lng: s.lng })),
        optimize,
      );
      setRoutePolyline(res.encoded_polyline);
      setRouteDurationSec(res.duration_seconds);
      setRouteDistanceM(res.distance_meters);

      // Reorder stops if Google optimized them. optimized_indices applies to
      // intermediates only (everything except the last stop = destination).
      if (optimize && res.optimized_indices && res.optimized_indices.length > 0) {
        const intermediates = stops.slice(0, -1);
        const destination = stops[stops.length - 1];
        const reorderedIntermediates = res.optimized_indices.map(i => intermediates[i]);
        setStops([...reorderedIntermediates, destination]);
        toast.success("Stops reordered for fastest route");
      }
    } catch {
      toast.error("Could not compute route — check Google Maps connector");
      setRoutePolyline("");
      setRouteDurationSec(null);
      setRouteDistanceM(null);
    } finally {
      setIsOptimizing(false);
      setIsComputingRoute(false);
    }
  }, [selectedDriverObj, stops, confirmedOrders]);

  // Auto-recompute (non-optimizing) when driver or stops change
  useEffect(() => {
    if (!selectedDriverObj?.current_lat || stops.length === 0) {
      setRoutePolyline("");
      setRouteDurationSec(null);
      setRouteDistanceM(null);
      return;
    }
    const t = setTimeout(() => { void runCompute(false); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriverId, stops]);

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };
  const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

  if (!canManage) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to create routes.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sd/routes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Create Route</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 shrink-0">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              s === step
                ? "border-primary bg-primary text-primary-foreground"
                : s < step
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground"
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`h-0.5 w-8 ${s < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1 ? "Select Driver" : step === 2 ? "Add Stops" : "Review"}
        </span>
      </div>

      {/* Map — always on top */}
      <div className="h-[340px] shrink-0 rounded-lg overflow-hidden border border-border">
        <RouteCreateMap
          drivers={availableDrivers}
          orders={confirmedOrders}
          stops={stops}
          selectedDriverId={selectedDriverId}
          encodedPolyline={routePolyline}
        />
      </div>

      {/* Route summary (ETA + distance) */}
      {(routeDurationSec !== null || isComputingRoute) && (
        <div className="flex items-center gap-4 text-sm rounded-md border border-border bg-muted/40 px-3 py-2 shrink-0">
          {isComputingRoute ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Computing route...
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{formatDuration(routeDurationSec!)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <RouteIcon className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{formatDistance(routeDistanceM!)}</span>
              </span>
              <span className="text-xs text-muted-foreground ml-auto">via Google Routes</span>
            </>
          )}
        </div>
      )}

      {/* Form below map */}
      <div className="space-y-4">
          {/* Step 1 — Driver & Date */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Driver *</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger><SelectValue placeholder="Choose a driver" /></SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} · {d.vehicle_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDrivers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No available drivers found.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2 — Add & Order Stops */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Confirmed Orders</Label>
                <Input
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by order no. or customer..."
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No confirmed orders available.</p>
                ) : (
                  filteredOrders.map(o => (
                    <button
                      key={o.id}
                      className="w-full text-left px-3 py-2 rounded-md border border-border hover:bg-muted/50 text-sm"
                      onClick={() => addStop(o)}
                    >
                      <span className="font-medium">{o.order_no}</span>
                      <span className="text-muted-foreground ml-2">
                        {o.partner_name || o.unregistered_customer_name} — {o.delivery_address}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {stops.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Stops ({stops.length})</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void runCompute(true)}
                      disabled={isOptimizing || stops.length < 2 || !selectedDriverObj?.current_lat}
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Optimize order
                    </Button>
                  </div>
                  {stops.map((s, i) => (
                    <Card key={s.order_id}>
                      <CardContent className="flex items-center gap-2 py-2 px-3">
                        <span className="font-bold text-sm text-muted-foreground w-6">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.order_no} — {s.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.delivery_address}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStop(i, -1)} disabled={i === 0}>
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1}>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStop(s.order_id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span>{selectedDriverObj?.name} · {selectedDriverObj?.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{routeDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stops</span>
                  <span>{stops.length}</span>
                </div>
              </div>
              <div className="space-y-1">
                {stops.map((s, i) => (
                  <div key={s.order_id} className="flex items-center gap-2 text-sm py-1">
                    <span className="font-bold text-muted-foreground w-6">{i + 1}</span>
                    <span>{s.order_no} — {s.customer_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t border-border mt-4 shrink-0">
          <Button variant="outline" onClick={() => step === 1 ? navigate("/sd/routes") : setStep(s => s - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && (!selectedDriverId || !routeDate)) ||
                (step === 2 && stops.length === 0)
              }
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleCreateRoute} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Route"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
