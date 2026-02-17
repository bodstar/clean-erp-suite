import { useState, useEffect } from "react";
import { BarChart3, Receipt, Wallet, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/KpiCard";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getOverview } from "@/lib/api/mpromo";
import type { MPromoOverview as OverviewData } from "@/types/mpromo";

export default function MPromoOverview() {
  const { scope, scopeMode } = useMPromoScope();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getOverview(scope)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
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
          subtitle={data ? `₦${data.today_redemptions_amount.toLocaleString()}` : undefined}
          isLoading={isLoading}
        />
        <KpiCard
          icon={Wallet}
          label={`Pending Payouts${scopeLabel}`}
          value={data?.pending_payouts_count ?? 0}
          subtitle={data ? `₦${data.pending_payouts_amount.toLocaleString()}` : undefined}
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
        {/* Top Partners */}
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
                    <span className="text-muted-foreground">{i + 1}. {p.name}</span>
                    <span className="font-medium">₦{p.value.toLocaleString()}</span>
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
                    <span className="text-muted-foreground">{i + 1}. {p.name}</span>
                    <span className="font-medium">₦{p.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + Chart Placeholder */}
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
                      <p className="text-foreground">{a.description}</p>
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
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Chart placeholder — connect API to populate
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
