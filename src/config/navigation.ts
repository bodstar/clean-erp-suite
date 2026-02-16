import {
  LayoutDashboard,
  Database,
  Package,
  Factory,
  Truck,
  DollarSign,
  Handshake,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
}

export const navigationItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Master Data", path: "/master-data", icon: Database, permission: "master-data.view" },
  { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.view" },
  { label: "Production", path: "/production", icon: Factory, permission: "production.view" },
  { label: "Sales & Distribution", path: "/sales", icon: Truck, permission: "sales.view" },
  { label: "Finance", path: "/finance", icon: DollarSign, permission: "finance.view" },
  { label: "Franchise Management", path: "/franchise", icon: Handshake, permission: "franchise.manage" },
  { label: "Reports", path: "/reports", icon: BarChart3, permission: "reports.view" },
  { label: "Settings", path: "/settings", icon: Settings, permission: "settings.view" },
];
