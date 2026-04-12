import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Truck, Clock, CheckCircle, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { useSDScope } from "@/providers/SDScopeProvider";
import { getSDOrders } from "@/lib/api/sd";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { SDOrderSummary } from "@/types/sd";

const chartConfig = {
  count: { label: "Orders", color: "hsl(var(--primary))" },
};

export default function SDOverview() {
  const { scope, scopeMode } = useSDScope();
  const [orders, setOrders] = useState<SDOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getSDOrders({}, scope)
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [scope]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr));
  const inTransit = orders.filter((o) => o.status === "in_transit");
  const pendingConfirm = orders.filter((o) => o.status === "draft" || o.status === "confirmed");
  const deliveredToday = orders.filter(
    (o) => o.status === "delivered" && o.delivered_at?.startsWith(todayStr)
  );
  const revenueToday = deliveredToday.reduce((sum, o) => sum + o.total, 0);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { status: "Draft", count: statusCounts["draft"] || 0 },
    { status: "Confirmed", count: statusCounts["confirmed"] || 0 },
    { status: "Assigned", count: statusCounts["assigned"] || 0 },
    { status: "In Transit", count: statusCounts["in_transit"] || 0 },
    { status: "Delivered", count: statusCounts["delivered"] || 0 },
    { status: "Failed", count: statusCounts["failed"] || 0 },
    { status: "Cancelled", count: statusCounts["cancelled"] || 0 },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={ShoppingCart} label="Total Orders Today" value={todayOrders.length} isLoading={isLoading} />
        <KpiCard icon={Truck} label="Orders In Transit" value={inTransit.length} isLoading={isLoading} />
        <KpiCard icon={Clock} label="Pending Confirmation" value={pendingConfirm.length} isLoading={isLoading} />
        <KpiCard icon={CheckCircle} label="Delivered Today" value={deliveredToday.length} isLoading={isLoading} />
        <KpiCard icon={Banknote} label="Revenue Today" value={`GH₵${revenueToday.toLocaleString()}`} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        to={`/sd/orders/${o.id}`}
                        className="text-primary hover:underline font-medium shrink-0"
                      >
                        {o.order_no}
                      </Link>
                      <span className="text-muted-foreground truncate">
                        {o.partner_name || o.unregistered_customer_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={o.status} />
                      <span className="font-medium">GH₵{o.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
