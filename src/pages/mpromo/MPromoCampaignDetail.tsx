import React, { useState, useEffect, useMemo } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, Square, Users, Calendar, Award, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCampaign, activateCampaign, pauseCampaign, endCampaign, getCampaignCodes, getCampaignRedemptions, AccessDeniedError } from "@/lib/api/mpromo";
import type { Campaign, PromoCode, Redemption } from "@/types/mpromo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";

interface ActivityItem {
  id: string;
  type: "code" | "redemption";
  description: string;
  time: string;
}

export default function MPromoCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, currentTeamId } = useAuth();
  const { scopeMode, targetTeamId } = useMPromoScope();
  const canManage = hasPermission("mpromo.campaign.manage") && scopeMode !== "all";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const campaignId = Number(id);
    setIsLoading(true);
    setAccessDenied(false);
    Promise.all([
      getCampaign(campaignId, { mode: scopeMode, targetTeamId: scopeMode === "target" ? targetTeamId : null }),
      getCampaignCodes(campaignId),
      getCampaignRedemptions(campaignId),
    ])
      .then(([c, codesRes, redsRes]) => {
        setCampaign(c);
        setCodes(codesRes.data);
        setRedemptions(redsRes.data);
      })
      .catch((err) => {
        if (err instanceof AccessDeniedError) setAccessDenied(true);
        setCampaign(null);
      })
      .finally(() => setIsLoading(false));
  }, [id, scopeMode, targetTeamId, currentTeamId]);

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

  // Build chart data — last 7 days of redemptions
  const chartData = useMemo(() => {
    const days: { date: string; count: number; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const dayReds = redemptions.filter((r) => format(parseISO(r.date), "yyyy-MM-dd") === dayStr);
      days.push({
        date: format(day, "MMM d"),
        count: dayReds.length,
        amount: dayReds.reduce((s, r) => s + r.amount, 0),
      });
    }
    return days;
  }, [redemptions]);

  // Build activity timeline
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...codes.filter((c) => c.redeemed_at).map((c) => ({
        id: `code-${c.id}`,
        type: "code" as const,
        description: `Code ${c.code} redeemed${c.issued_to ? ` by ${c.issued_to}` : ""}`,
        time: c.redeemed_at!,
      })),
      ...redemptions.map((r) => ({
        id: `red-${r.id}`,
        type: "redemption" as const,
        description: `GH₵${r.amount.toLocaleString()} redeemed by ${r.partner_name}`,
        time: r.date,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items;
  }, [codes, redemptions]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!campaign) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/campaigns")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Button>
        {accessDenied ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>This campaign belongs to another team. You do not have permission to view it.</AlertDescription>
          </Alert>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Campaign not found.</div>
        )}
      </div>
    );
  }

  const codeCols: DataTableColumn<PromoCode>[] = [
    { key: "code", header: "Code" },
    { key: "issued_to", header: "Issued To", render: (r) => r.issued_to || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "expires_at", header: "Expires" },
    { key: "redeemed_at", header: "Redeemed At", render: (r) => r.redeemed_at || "—" },
  ];

  const redemptionCols: DataTableColumn<Redemption>[] = [
    { key: "date", header: "Date" },
    { key: "partner_name", header: "Partner", render: (r) => <Link to={`/mpromo/partners/${r.partner_id}`} className="text-primary hover:underline">{r.partner_name}</Link> },
    { key: "amount", header: "Amount", render: (r) => `GH₵${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
  ];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/campaigns")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{campaign.name}</h2>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {campaign.type.replace("_", " ")} · {campaign.start_date} → {campaign.end_date}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {campaign.team_name && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" /> {campaign.team_name}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" /> Created {campaign.created_at}
                </Badge>
              </div>

              {/* Tiers / Reward display */}
              {campaign.type === "VOLUME_REBATE" && campaign.tiers && campaign.tiers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rebate Tiers</p>
                  <div className="inline-grid grid-cols-3 gap-x-6 gap-y-1 text-sm border rounded-md p-2">
                    <span className="text-xs font-medium text-muted-foreground">Threshold</span>
                    <span className="text-xs font-medium text-muted-foreground">Reward</span>
                    <span className="text-xs font-medium text-muted-foreground">Points</span>
                    {campaign.tiers.map((t, i) => (
                      <React.Fragment key={i}>
                        <span>{t.threshold} units</span>
                        <span>GH₵{t.reward_amount.toLocaleString()}</span>
                        <span>{t.loyalty_points} pts</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              {campaign.type === "MYSTERY_SHOPPER" && campaign.reward_amount && (
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Reward: <strong>GH₵{campaign.reward_amount.toLocaleString()}</strong></span>
                  </div>
                  {campaign.loyalty_points != null && (
                    <span>· <strong>{campaign.loyalty_points}</strong> pts per redemption</span>
                  )}
                </div>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 shrink-0">
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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="codes">Codes ({codes.length})</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions ({redemptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-bold">{campaign.total_redemptions}</p>
                <p className="text-xs text-muted-foreground">Total Redemptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-bold">GH₵{campaign.total_spend.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Spend</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-bold">{codes.length}</p>
                <p className="text-xs text-muted-foreground">Codes Issued</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Redemptions — Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "count" ? [value, "Redemptions"] : [`GH₵${value.toLocaleString()}`, "Amount"]
                      }
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No redemptions in the last 7 days.</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activity.slice(0, 15).map((a) => (
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

        <TabsContent value="codes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Campaign Codes</CardTitle>
              <Link to="/mpromo/codes" className="text-xs text-primary hover:underline">View all codes</Link>
            </CardHeader>
            <CardContent>
              <DataTable columns={codeCols} data={codes} emptyMessage="No codes issued for this campaign." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Campaign Redemptions</CardTitle>
              <Link to="/mpromo/redemptions" className="text-xs text-primary hover:underline">View all redemptions</Link>
            </CardHeader>
            <CardContent>
              <DataTable columns={redemptionCols} data={redemptions} emptyMessage="No redemptions for this campaign." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
