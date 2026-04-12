import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Route,
  Map,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Overview", path: "/sd/overview", icon: LayoutDashboard },
  { label: "Orders", path: "/sd/orders", icon: ShoppingCart, permission: "sd.orders.view" },
  { label: "Products", path: "/sd/products", icon: Package, permission: "sd.products.view" },
  { label: "Customers", path: "/sd/customers", icon: Users, permission: "sd.customers.view" },
  { label: "Drivers", path: "/sd/drivers", icon: Truck, permission: "sd.drivers.view" },
  { label: "Routes", path: "/sd/routes", icon: Route, permission: "sd.routes.view" },
  { label: "Dispatch Map", path: "/sd/map", icon: Map },
];

export function SDLayout() {
  const { hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  const visibleTabs = tabs.filter(
    (t) => !t.permission || hasPermission(t.permission)
  );

  const activeTab = visibleTabs.find((t) => location.pathname.startsWith(t.path));

  return (
    <div className="space-y-4 overflow-hidden">
      {isMobile ? (
        <div className="border-b border-border pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  {activeTab && <activeTab.icon className="h-4 w-4" />}
                  {activeTab?.label ?? "Navigate"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {visibleTabs.map((tab) => (
                <NavLink key={tab.path} to={tab.path}>
                  <DropdownMenuItem
                    className={cn(
                      "gap-2 cursor-pointer",
                      location.pathname.startsWith(tab.path) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </DropdownMenuItem>
                </NavLink>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <nav className="flex gap-1 overflow-x-auto pb-1 border-b border-border max-w-full">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors flex-shrink-0",
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
      )}

      <div className="min-h-[60vh]">
        <Outlet />
      </div>
    </div>
  );
}
