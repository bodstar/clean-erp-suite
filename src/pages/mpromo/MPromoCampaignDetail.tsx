import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCampaign, activateCampaign, pauseCampaign, endCampaign } from "@/lib/api/mpromo";
import type { Campaign, PromoCode, Redemption } from "@/types/mpromo";
import { toast } from "sonner";

export default function MPromoCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { scopeMode } = useMPromoScope();
  const canManage = hasPermission("mpromo.campaign.manage") && scopeMode !== "all";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getCampaign(Number(id))
      .then(setCampaign)
      .catch(() => setCampaign(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAction = async (action: "activate" | "pause" | "end") => {
    try {
      if (action === "activate") await activateCampaign(Number(id));
      if (action === "pause") await pauseCampaign(Number(id));
      if (action === "end") await endCampaign(Number(id));
      toast.success(`Campaign ${action}d`);
      setCampaign((c) => c ? { ...c, status: action === "activate" ? "active" : action === "pause" ? "paused" : "ended" } : c);
    } catch {
      toast.error(`Failed to ${action} campaign`);
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!campaign) return <div className="text-center py-12 text-muted-foreground">Campaign not found.</div>;

  const codeCols: DataTableColumn<PromoCode>[] = [
    { key: "code", header: "Code" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "expires_at", header: "Expires" },
    { key: "redeemed_at", header: "Redeemed At", render: (r) => r.redeemed_at || "—" },
  ];

  const redemptionCols: DataTableColumn<Redemption>[] = [
    { key: "date", header: "Date" },
    { key: "partner_name", header: "Partner" },
    { key: "amount", header: "Amount", render: (r) => `₦${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
  ];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/campaigns")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{campaign.name}</h2>
              <p className="text-sm text-muted-foreground">{campaign.type.replace("_", " ")} · {campaign.start_date} → {campaign.end_date}</p>
              <div className="mt-2"><StatusBadge status={campaign.status} /></div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                {campaign.status !== "active" && campaign.status !== "ended" && (
                  <Button size="sm" onClick={() => handleAction("activate")} className="gap-1.5">
                    <Play className="h-4 w-4" /> Activate
                  </Button>
                )}
                {campaign.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => handleAction("pause")} className="gap-1.5">
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                )}
                {campaign.status !== "ended" && (
                  <Button variant="destructive" size="sm" onClick={() => handleAction("end")} className="gap-1.5">
                    <Square className="h-4 w-4" /> End
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold">{campaign.total_redemptions}</p>
            <p className="text-xs text-muted-foreground">Total Redemptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold">₦{campaign.total_spend.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-center text-sm text-muted-foreground">
            Chart placeholder
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Codes</CardTitle>
          <Link to="/mpromo/codes" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          <DataTable columns={codeCols} data={[]} emptyMessage="No codes issued." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Redemptions</CardTitle>
          <Link to="/mpromo/redemptions" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          <DataTable columns={redemptionCols} data={[]} emptyMessage="No redemptions yet." />
        </CardContent>
      </Card>
    </div>
  );
}
