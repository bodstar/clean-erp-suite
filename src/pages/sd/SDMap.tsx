import { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/providers/ThemeProvider";
import { useSDScope } from "@/providers/SDScopeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getDispatchMapDrivers } from "@/lib/api/sd";
import { useSDRealtime } from "@/hooks/useSDRealtime";
import type { DispatchMapDriver, DriverStatus } from "@/types/sd";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Locate, RefreshCw, Radio, Truck, ChevronUp, ChevronDown, ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
});

const STATUS_COLORS: Record<DriverStatus, string> = {
  on_delivery: "hsl(var(--warning))",
  available: "hsl(var(--success))",
  off_duty: "hsl(var(--muted-foreground))",
};

const STATUS_BG: Record<DriverStatus, string> = {
  on_delivery: "#f59e0b",
  available: "#22c55e",
  off_duty: "#9ca3af",
};

function driverDivIcon(name: string, status: DriverStatus) {
  const bg = STATUS_BG[status];
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${bg};color:#fff;font-weight:700;font-size:12px;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    ">${initials}</div>`,
  });
}

const STATUS_FILTERS: { value: "all" | DriverStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "on_delivery", label: "On Delivery" },
  { value: "available", label: "Available" },
  { value: "off_duty", label: "Off Duty" },
];

export default function SDMap() {
  const { theme } = useTheme();
  const { scope } = useSDScope();
  const { currentTeamId, hasPermission } = useAuth();

  const [drivers, setDrivers] = useState<DispatchMapDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | DriverStatus>("all");
  const [selectedDriver, setSelectedDriver] = useState<DispatchMapDriver | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const destinationMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const routeLinesRef = useRef<Map<number, L.Polyline>>(new Map());
  const driversRef = useRef<DispatchMapDriver[]>([]);

  useEffect(() => { driversRef.current = drivers; }, [drivers]);

  const isDark = theme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Load drivers
  const loadDrivers = useCallback(async () => {
    if (!hasPermission("sd.view")) return;
    setIsLoading(true);
    try {
      const data = await getDispatchMapDrivers(scope);
      setDrivers(data);
    } catch {
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, [scope, hasPermission]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  // Init map
  useEffect(() => {
    if (isLoading || !mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView([5.6037, -0.187], 12);
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLoading]);

  // Theme tile switch
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) mapRef.current!.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(mapRef.current);
  }, [tileUrl]);

  // Rebuild markers when drivers or filter change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old
    driverMarkersRef.current.forEach(m => m.remove());
    destinationMarkersRef.current.forEach(m => m.remove());
    routeLinesRef.current.forEach(l => l.remove());
    driverMarkersRef.current.clear();
    destinationMarkersRef.current.clear();
    routeLinesRef.current.clear();

    const filtered = statusFilter === "all"
      ? drivers
      : drivers.filter(d => d.status === statusFilter);

    const bounds: L.LatLngExpression[] = [];

    filtered.forEach(d => {
      const marker = L.marker([d.current_lat, d.current_lng], {
        icon: driverDivIcon(d.driver_name, d.status),
      }).addTo(map);

      marker.bindPopup(`
        <strong>${d.driver_name}</strong><br/>
        ${d.vehicle_type} · ${d.vehicle_plate}<br/>
        ${d.current_order_no ? `→ ${d.current_order_no} — ${d.current_destination}` : "No active delivery"}
      `);

      marker.on("click", () => {
        setSelectedDriver(d);
      });

      driverMarkersRef.current.set(d.driver_id, marker);
      bounds.push([d.current_lat, d.current_lng]);

      // Destination marker + route line for on_delivery
      if (d.current_destination_lat && d.current_destination_lng) {
        const destMarker = L.marker(
          [d.current_destination_lat, d.current_destination_lng],
          { icon: destinationIcon }
        ).addTo(map);
        destMarker.bindPopup(`<strong>${d.current_destination}</strong><br/>${d.current_order_no}`);
        destinationMarkersRef.current.set(d.driver_id, destMarker);

        const line = L.polyline(
          [[d.current_lat, d.current_lng], [d.current_destination_lat, d.current_destination_lng]],
          { color: "#f59e0b", weight: 2, dashArray: "6 4", opacity: 0.8 }
        ).addTo(map);
        routeLinesRef.current.set(d.driver_id, line);

        bounds.push([d.current_destination_lat, d.current_destination_lng]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]), { padding: [40, 40] });
    }
  }, [drivers, statusFilter]);

  // Real-time updates
  const handleDriverLocationUpdate = useCallback((driverId: number, lat: number, lng: number) => {
    setDrivers(prev => prev.map(d =>
      d.driver_id === driverId
        ? { ...d, current_lat: lat, current_lng: lng, last_location_at: new Date().toISOString() }
        : d
    ));
    setSelectedDriver(prev =>
      prev?.driver_id === driverId
        ? { ...prev, current_lat: lat, current_lng: lng, last_location_at: new Date().toISOString() }
        : prev
    );

    const marker = driverMarkersRef.current.get(driverId);
    if (marker) marker.setLatLng([lat, lng]);

    const line = routeLinesRef.current.get(driverId);
    const driver = driversRef.current.find(d => d.driver_id === driverId);
    if (line && driver?.current_destination_lat) {
      line.setLatLngs([[lat, lng], [driver.current_destination_lat, driver.current_destination_lng!]]);
    }
  }, []);

  useSDRealtime({
    teamId: currentTeamId ?? 1,
    onDriverLocationUpdate: handleDriverLocationUpdate,
    enabled: realtimeEnabled,
  });

  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts: L.LatLngExpression[] = [];
    driverMarkersRef.current.forEach(m => pts.push(m.getLatLng()));
    destinationMarkersRef.current.forEach(m => pts.push(m.getLatLng()));
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts as L.LatLngTuple[]), { padding: [40, 40] });
  };

  const panToDriver = (d: DispatchMapDriver) => {
    setSelectedDriver(d);
    mapRef.current?.setView([d.current_lat, d.current_lng], 15);
    const marker = driverMarkersRef.current.get(d.driver_id);
    if (marker) marker.openPopup();
  };

  const filteredDrivers = statusFilter === "all"
    ? drivers
    : drivers.filter(d => d.status === statusFilter);

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Dispatch Map</h2>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rt-toggle" className="text-xs text-muted-foreground">Live</Label>
            <Switch
              id="rt-toggle"
              checked={realtimeEnabled}
              onCheckedChange={setRealtimeEnabled}
            />
          </div>
        </div>
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "default" : "outline"}
              className="h-7 text-xs px-2.5"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Driver list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No drivers found for current filters.
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {filteredDrivers.map(d => (
              <button
                key={d.driver_id}
                onClick={() => panToDriver(d)}
                className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent/50 ${
                  selectedDriver?.driver_id === d.driver_id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">{d.driver_name}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Truck className="h-3 w-3" />
                  {d.vehicle_plate}
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.current_destination
                    ? `→ ${d.current_order_no} — ${d.current_destination}`
                    : "No active delivery"
                  }
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Last seen {formatDistanceToNow(new Date(d.last_location_at), { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="relative flex h-[calc(100vh-theme(spacing.32))] rounded-lg overflow-hidden border border-border bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 flex-col border-r border-border bg-background shrink-0">
        {sidebarContent}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />
        )}

        {/* Map controls */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md" onClick={fitAll}>
            <Locate className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md" onClick={loadDrivers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            Drivers ({filteredDrivers.length})
          </Button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden absolute bottom-12 left-0 right-0 z-[1000] max-h-[50vh] bg-background border-t border-border overflow-auto rounded-t-xl shadow-xl">
            {sidebarContent}
          </div>
        )}
      </div>
    </div>
  );
}
