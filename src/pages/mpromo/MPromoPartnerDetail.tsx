import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Edit, Ban, CheckCircle, MapPin, LocateFixed, Star, PenLine, Map, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { MapPickerModal } from "@/components/mpromo/MapPickerModal";
import { EditPartnerModal } from "@/components/mpromo/EditPartnerModal";
import { AdjustPointsModal } from "@/components/mpromo/AdjustPointsModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getPartner, updatePartner, updatePartnerGeolocation, getPartnerRedemptions, getPartnerOrders, getPartnerPointsHistory, adjustPartnerPoints, suspendPartner, activatePartner, AccessDeniedError } from "@/lib/api/mpromo";
import { getForms, getSubmissions } from "@/lib/api/market-data";
import { FormSubmissionsTable } from "@/components/mpromo/FormSubmissionsTable";
import { FormSubmissionModal } from "@/components/mpromo/FormSubmissionModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FormDefinition, FormSubmission } from "@/types/market-data";
import type { Partner, PartnerType, PartnerStatus, Redemption, MPromoOrder, PointsHistoryEntry } from "@/types/mpromo";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ActivityItem {
  id: string;
  type: "redemption" | "order";
  description: string;
  time: string;
}

export default function MPromoPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "activity";
  const navigate = useNavigate();
  const { hasPermission, currentTeamId } = useAuth();
  const { scopeMode, targetTeamId } = useMPromoScope();
  const canManage = hasPermission("mpromo.partners.manage");

  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [orders, setOrders] = useState<MPromoOrder[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [confirmStatusChange, setConfirmStatusChange] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustPointsOpen, setAdjustPointsOpen] = useState(false);
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<Record<string, FormSubmission[]>>({});
  const [submitFormTarget, setSubmitFormTarget] = useState<FormDefinition | null>(null);


  // Load market data forms and submissions for this partner
  useEffect(() => {
    if (!id) return;
    const partnerId = Number(id);
    Promise.all([getForms(), getSubmissions(undefined, partnerId)]).then(([allForms, subs]) => {
      const activeForms = allForms.filter((f) => f.status === "active");
      setForms(activeForms);
      const grouped: Record<string, FormSubmission[]> = {};
      for (const f of activeForms) grouped[f.id] = subs.filter((s) => s.form_id === f.id);
      setFormSubmissions(grouped);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const partnerId = Number(id);
    setIsLoading(true);
    setAccessDenied(false);
    Promise.all([
      getPartner(partnerId, { mode: scopeMode, targetTeamId: scopeMode === "target" ? targetTeamId : null }),
      getPartnerRedemptions(partnerId),
      getPartnerOrders(partnerId),
      getPartnerPointsHistory(partnerId),
    ])
      .then(([p, reds, ords, pts]) => {
        setPartner(p);
        setRedemptions(reds.data);
        setOrders(ords.data);
        setPointsHistory(pts);

        // Build activity timeline from redemptions + orders, sorted by date desc
        const items: ActivityItem[] = [
          ...reds.data.map((r: Redemption) => ({
            id: `red-${r.id}`,
            type: "redemption" as const,
            description: `GH₵${r.amount.toLocaleString()} redeemed`,
            time: r.date,
          })),
          ...ords.data.map((o: MPromoOrder) => ({
            id: `ord-${o.id}`,
            type: "order" as const,
            description: `Order ${o.order_no} · GH₵${o.total.toLocaleString()}`,
            time: o.date,
          })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivity(items);
      })
      .catch((err) => {
        if (err instanceof AccessDeniedError) setAccessDenied(true);
        setPartner(null);
      })
      .finally(() => setIsLoading(false));
  }, [id, scopeMode, targetTeamId, currentTeamId]);

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

  const handleToggleStatus = async () => {
    if (!partner) return;
    try {
      if (partner.status === "active") {
        await suspendPartner(partner.id);
        toast.success(`${partner.name} suspended`);
        setPartner((p) => p ? { ...p, status: "suspended" } : p);
      } else {
        await activatePartner(partner.id);
        toast.success(`${partner.name} activated`);
        setPartner((p) => p ? { ...p, status: "active" } : p);
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setConfirmStatusChange(false);
    }
  };

  const handleEditSave = async (data: { name: string; phone: string; type: PartnerType; status: PartnerStatus }) => {
    try {
      await updatePartner(Number(id), data);
      setPartner((p) => p ? { ...p, ...data } : p);
      toast.success("Partner updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update partner");
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
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/partners")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Partners
        </Button>
        {accessDenied ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>This partner belongs to another team. You do not have permission to view it.</AlertDescription>
          </Alert>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Partner not found.</div>
        )}
      </div>
    );
  }

  const redemptionCols: DataTableColumn<Redemption>[] = [
    { key: "date", header: "Date" },
    { key: "campaign_name", header: "Campaign", render: (r) => <button type="button" className="text-primary hover:underline" onClick={() => navigate(`/mpromo/campaigns/${r.campaign_id}`)}>{r.campaign_name}</button> },
    { key: "amount", header: "Amount", render: (r) => `GH₵${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
  ];

  const orderCols: DataTableColumn<MPromoOrder>[] = [
    { key: "order_no", header: "Order No" },
    { key: "date", header: "Date" },
    { key: "total", header: "Total", render: (r) => `GH₵${r.total.toLocaleString()}` },
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
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={partner.status} />
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <Star className="h-4 w-4" />
                  {partner.loyalty_points.toLocaleString()} pts
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {partner.latitude && partner.longitude && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/mpromo/map?partner=${partner.id}`)}>
                  <Map className="h-4 w-4 mr-1.5" /> View on Map
                </Button>
              )}
              {canManage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 mr-1.5" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => setAdjustPointsOpen(true)}><PenLine className="h-4 w-4 mr-1.5" /> Adjust Points</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmStatusChange(true)}>
                    {partner.status === "active"
                      ? <><Ban className="h-4 w-4 mr-1.5" /> Suspend</>
                      : <><CheckCircle className="h-4 w-4 mr-1.5" /> Activate</>}
                  </Button>
                </>
              )}
            </div>
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
            <div className="space-y-3">
              <div className="relative z-0 h-48 rounded-md overflow-hidden border">
                <PartnerLocationMap lat={partner.latitude} lng={partner.longitude} />
              </div>
              <p className="text-xs text-muted-foreground">
                Lat: {partner.latitude.toFixed(6)}, Lng: {partner.longitude.toFixed(6)}
              </p>
            </div>
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

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="points">Points History</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${a.type === "redemption" ? "bg-primary" : "bg-accent-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="points" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {pointsHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No points earned yet.</p>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Star className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground font-medium">+{entry.points} pts</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{entry.date}</p>
                        </div>
                        <button type="button" className="text-xs text-primary hover:underline" onClick={() => navigate(`/mpromo/campaigns/${entry.campaign_id}`)}>{entry.campaign_name}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="redemptions" className="mt-4">
          <DataTable columns={redemptionCols} data={redemptions} emptyMessage="No redemptions yet." />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <DataTable columns={orderCols} data={orders} emptyMessage="No orders yet." />
        </TabsContent>
      </Tabs>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapPick}
        initialLat={partner.latitude ?? undefined}
        initialLng={partner.longitude ?? undefined}
      />

      <ConfirmDialog
        open={confirmStatusChange}
        onOpenChange={setConfirmStatusChange}
        title={partner.status === "active" ? "Suspend Partner" : "Activate Partner"}
        description={
          partner.status === "active"
            ? `Are you sure you want to suspend "${partner.name}"? They will no longer be able to redeem codes or place orders.`
            : `Are you sure you want to activate "${partner.name}"?`
        }
        confirmLabel={partner.status === "active" ? "Suspend" : "Activate"}
        variant={partner.status === "active" ? "destructive" : "default"}
        onConfirm={handleToggleStatus}
      />

      {partner && (
        <EditPartnerModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          partner={partner}
          onSave={handleEditSave}
        />
      )}

      {partner && (
        <AdjustPointsModal
          open={adjustPointsOpen}
          onClose={() => setAdjustPointsOpen(false)}
          partnerName={partner.name}
          currentPoints={partner.loyalty_points}
          onConfirm={async (adj) => {
            const result = await adjustPartnerPoints(partner.id, adj);
            setPartner((p) => p ? { ...p, loyalty_points: result.new_balance } : p);
            toast.success(
              `${adj.type === "add" ? "Added" : "Deducted"} ${adj.amount.toLocaleString()} pts. New balance: ${result.new_balance.toLocaleString()} pts`
            );
          }}
        />
      )}
    </div>
  );
}

function PartnerLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Load market data forms and submissions for this partner
  useEffect(() => {
    if (!id) return;
    const partnerId = Number(id);
    Promise.all([getForms(), getSubmissions(undefined, partnerId)]).then(([allForms, subs]) => {
      const activeForms = allForms.filter((f) => f.status === "active");
      setForms(activeForms);
      const grouped: Record<string, FormSubmission[]> = {};
      for (const f of activeForms) grouped[f.id] = subs.filter((s) => s.form_id === f.id);
      setFormSubmissions(grouped);
    });
  }, [id]);


    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="hsl(var(--primary-foreground))"/></svg>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker([lat, lng], { icon }).addTo(map);

    return () => { map.remove(); };
  }, [lat, lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}
