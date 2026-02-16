import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Users, Package, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Orders", value: "—", icon: TrendingUp },
  { label: "Inventory Items", value: "—", icon: Package },
  { label: "Active Customers", value: "—", icon: Users },
  { label: "Production Batches", value: "—", icon: LayoutDashboard },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your operations</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-medium text-foreground">Dashboard Widgets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Charts, KPIs, and activity feeds will appear here once connected to your backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
