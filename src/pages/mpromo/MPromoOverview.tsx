import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Receipt, Wallet, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/KpiCard";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getOverview, getRedemptions } from "@/lib/api/mpromo";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import type { MPromoOverview as OverviewData } from "@/types/mpromo";

type TrendPoint = { dateKey: string; label: string; count: number };

const chartConfig = {
  count: { label: "Redemptions", color: "hsl(var(--primary))" },
};

function buildLast14Days(): { dateKey: string; label: string }[] {
  const days: { dateKey: string; label: string }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    days.push({ dateKey, label });
  }
  return days;
}

export default function MPromoOverview() {
  const { scope, scopeMode } = useMPromoScope();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getOverview(scope)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [scope]);

  useEffect(() => {
    setTrendLoading(true);
    getRedemptions({ page: 1, page_size: 500 }, scope)
      .then((res) => {
        const counts: Record<string, number> = {};
        for (const r of res.data) {
          const key = r.date.slice(0, 10);
          counts[key] = (counts[key] || 0) + 1;
        }
        const days = buildLast14Days();
        setTrendData(days.map((d) => ({ ...d, count: counts[d.dateKey] || 0 })));
      })
      .catch(() => setTrendData(buildLast14Days().map((d) => ({ ...d, count: 0 }))))
      .finally(() => setTrendLoading(false));
  }, [scope]);

  const scopeLabel = scopeMode === "all" ? " (All Teams)" : "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={BarChart3}
          label={`Active Campaigns${scopeLabel}`}
          value={data?.active_campaigns ?? 0}
          isLoading={isLoading}
        />
        <KpiCard
          icon={Receipt}
          label={`Today's Redemptions${scopeLabel}`}
          value={data?.today_redemptions_count ?? 0}
          subtitle={data ? `GH₵${data.today_redemptions_amount.toLocaleString()}` : undefined}
          isLoading={isLoading}
        />
        <KpiCard
          icon={Wallet}
          label={`Pending Payouts${scopeLabel}`}
          value={data?.pending_payouts_count ?? 0}
          subtitle={data ? `GH₵${data.pending_payouts_amount.toLocaleString()}` : undefined}
          isLoading={isLoading}
        />
        <KpiCard
          icon={ShoppingCart}
          label={`Orders Today${scopeLabel}`}
          value={data?.orders_today ?? 0}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top Chillers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : data?.top_chillers && data.top_chillers.length > 0 ? (
              <div className="space-y-2">
                {data.top_chillers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{i + 1}. <Link to={`/mpromo/partners/${p.id}`} className="text-primary hover:underline">{p.name}</Link></span>
                    <span className="font-medium">GH₵{p.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top Ice Water Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : data?.top_ice_water_sellers && data.top_ice_water_sellers.length > 0 ? (
              <div className="space-y-2">
                {data.top_ice_water_sellers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{i + 1}. <Link to={`/mpromo/partners/${p.id}`} className="text-primary hover:underline">{p.name}</Link></span>
                    <span className="font-medium">GH₵{p.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : data?.recent_activity && data.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {data.recent_activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-foreground">
                        {a.partner_id && a.partner_name
                          ? <>{a.description.split(a.partner_name)[0]}<Link to={`/mpromo/partners/${a.partner_id}`} className="text-primary hover:underline">{a.partner_name}</Link>{a.description.split(a.partner_name).slice(1).join(a.partner_name)}</>
                          : a.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Redemptions Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {trendLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}