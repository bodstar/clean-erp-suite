import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/providers/ThemeProvider";
import { getMapPartners } from "@/lib/api/mpromo";
import type { MapPartner } from "@/types/mpromo";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart, Receipt } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const chillerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iceWaterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MPromoMap() {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());

  const [partners, setPartners] = useState<MapPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<MapPartner | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [heatmap, setHeatmap] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isDark = theme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([6.5244, 3.3792], 11);
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(map);
    markersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current!.removeLayer(layer);
      }
    });
    L.tileLayer(tileUrl, { attribution: "&copy; OpenStreetMap" }).addTo(mapRef.current);
  }, [tileUrl]);

  const loadPartners = useCallback(
    (bounds: L.LatLngBounds, zoom: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const data = await getMapPartners({
            bbox: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
            zoom,
            type: typeFilter !== "all" ? typeFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: search || undefined,
          });
          setPartners(data);
        } catch {
          setPartners([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [typeFilter, statusFilter, search]
  );

  // Bind map events
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handler = () => loadPartners(map.getBounds(), map.getZoom());
    map.on("moveend", handler);
    map.on("zoomend", handler);
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [loadPartners]);

  // Update markers
  useEffect(() => {
    markersRef.current.clearLayers();
    partners.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: p.type === "CHILLER" ? chillerIcon : iceWaterIcon,
      });
      marker.on("click", () => setSelectedPartner(p));
      markersRef.current.addLayer(marker);
    });
  }, [partners]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Partner Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CHILLER">Chillers</SelectItem>
              <SelectItem value="ICE_WATER_SELLER">Ice Water Sellers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Search</Label>
          <Input className="w-48 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / Phone / Location" />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="heatmap" checked={heatmap} onCheckedChange={setHeatmap} />
          <Label htmlFor="heatmap" className="text-xs">Heatmap</Label>
        </div>
        {isLoading && <Skeleton className="h-4 w-16" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Map */}
        <div
          ref={mapContainerRef}
          className="rounded-lg border border-border overflow-hidden h-[500px]"
        />

        {/* Side panel */}
        <Card className="h-[500px] overflow-auto">
          <CardContent className="p-4">
            {selectedPartner ? (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground">{selectedPartner.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedPartner.type.replace("_", " ")} · {selectedPartner.phone}</p>
                <p className="text-xs text-muted-foreground">{selectedPartner.location}</p>
                <p className="text-xs">Status: <span className="capitalize font-medium">{selectedPartner.status}</span></p>
                <p className="text-xs">Last Activity: {selectedPartner.last_activity || "—"}</p>

                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Redemptions</span>
                    <span>{selectedPartner.redemptions_count} · ₦{selectedPartner.redemptions_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders</span>
                    <span>{selectedPartner.orders_count} · ₦{selectedPartner.orders_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Payouts</span>
                    <span>{selectedPartner.pending_payouts_count} · ₦{selectedPartner.pending_payouts_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex flex-col gap-2">
                  <Link to={`/mpromo/partners/${selectedPartner.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <Eye className="h-3.5 w-3.5" /> View Partner
                    </Button>
                  </Link>
                  <Link to={`/mpromo/orders?partner=${selectedPartner.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <ShoppingCart className="h-3.5 w-3.5" /> View Orders
                    </Button>
                  </Link>
                  <Link to={`/mpromo/redemptions?partner=${selectedPartner.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <Receipt className="h-3.5 w-3.5" /> View Redemptions
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Click a marker to view partner details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {heatmap && (
        <p className="text-xs text-muted-foreground italic">Heatmap layer placeholder — will overlay redemption intensity when enabled via API.</p>
      )}
    </div>
  );
}
