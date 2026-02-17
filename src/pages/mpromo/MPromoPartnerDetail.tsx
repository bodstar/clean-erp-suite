import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Ban, CheckCircle, MapPin, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { MapPickerModal } from "@/components/mpromo/MapPickerModal";
import { useAuth } from "@/providers/AuthProvider";
import { getPartner, updatePartnerGeolocation } from "@/lib/api/mpromo";
import type { Partner, Redemption, MPromoOrder } from "@/types/mpromo";
import { toast } from "sonner";

export default function MPromoPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("mpromo.partners.manage");

  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getPartner(Number(id))
      .then(setPartner)
      .catch(() => setPartner(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCaptureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updatePartnerGeolocation(Number(id), {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          toast.success("Location captured");
          setPartner((p) => p ? { ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude } : p);
        } catch {
          toast.error("Failed to save location");
        }
      },
      () => toast.error("Unable to get current location")
    );
  };

  const handleMapPick = async (coords: { latitude: number; longitude: number }) => {
    try {
      await updatePartnerGeolocation(Number(id), coords);
      toast.success("Location saved");
      setPartner((p) => p ? { ...p, ...coords } : p);
      setMapOpen(false);
    } catch {
      toast.error("Failed to save location");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12 text-muted-foreground">Partner not found.</div>
    );
  }

  const redemptionCols: DataTableColumn<Redemption>[] = [
    { key: "date", header: "Date" },
    { key: "campaign_name", header: "Campaign" },
    { key: "amount", header: "Amount", render: (r) => `₦${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
  ];

  const orderCols: DataTableColumn<MPromoOrder>[] = [
    { key: "order_no", header: "Order No" },
    { key: "date", header: "Date" },
    { key: "total", header: "Total", render: (r) => `₦${r.total.toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/partners")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Partners
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{partner.name}</h2>
              <p className="text-sm text-muted-foreground">{partner.phone} · {partner.type.replace("_", " ")} · {partner.location}</p>
              <div className="mt-2">
                <StatusBadge status={partner.status} />
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1.5" /> Edit</Button>
                <Button variant="outline" size="sm">
                  {partner.status === "active"
                    ? <><Ban className="h-4 w-4 mr-1.5" /> Suspend</>
                    : <><CheckCircle className="h-4 w-4 mr-1.5" /> Activate</>}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Geolocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Geolocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partner.latitude && partner.longitude ? (
            <p className="text-sm">Lat: {partner.latitude.toFixed(6)}, Lng: {partner.longitude.toFixed(6)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Location not captured</p>
          )}
          {canManage && (
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleCaptureLocation}>
                <LocateFixed className="h-4 w-4 mr-1.5" /> Use my current location
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}>
                <MapPin className="h-4 w-4 mr-1.5" /> Pick on map
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Activity timeline will appear here when connected to the API.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="redemptions" className="mt-4">
          <DataTable columns={redemptionCols} data={[]} emptyMessage="No redemptions yet." />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <DataTable columns={orderCols} data={[]} emptyMessage="No orders yet." />
        </TabsContent>
      </Tabs>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapPick}
        initialLat={partner.latitude ?? undefined}
        initialLng={partner.longitude ?? undefined}
      />
    </div>
  );
}
