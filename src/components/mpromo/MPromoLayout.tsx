import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  QrCode,
  Receipt,
  Wallet,
  ShoppingCart,
  Map,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { MPromoScopeProvider } from "@/providers/MPromoScopeProvider";
import { ScopeSelector } from "@/components/mpromo/ScopeSelector";

const tabs = [
  { label: "Overview", path: "/mpromo/overview", icon: LayoutDashboard },
  { label: "Partners", path: "/mpromo/partners", icon: Users, permission: "mpromo.partners.manage" },
  { label: "Campaigns", path: "/mpromo/campaigns", icon: Megaphone, permission: "mpromo.campaign.manage" },
  { label: "Codes", path: "/mpromo/codes", icon: QrCode, permission: "mpromo.codes.manage" },
  { label: "Redemptions", path: "/mpromo/redemptions", icon: Receipt, permission: "mpromo.redemptions.view" },
  { label: "Payouts", path: "/mpromo/payouts", icon: Wallet, permission: "mpromo.payouts.manage" },
  { label: "Orders", path: "/mpromo/orders", icon: ShoppingCart, permission: "mpromo.orders.view" },
  { label: "Map", path: "/mpromo/map", icon: Map },
  { label: "Geo Queue", path: "/mpromo/geo-queue", icon: MapPin, permission: "mpromo.partners.manage" },
];

export function MPromoLayout() {
  const { hasPermission } = useAuth();

  const visibleTabs = tabs.filter(
    (t) => !t.permission || hasPermission(t.permission)
  );

  return (
    <MPromoScopeProvider>
      <div className="space-y-4">
        <ScopeSelector />
        <nav className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors",
                  isActive
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-h-[60vh]">
          <Outlet />
        </div>
      </div>
    </MPromoScopeProvider>
  );
}
