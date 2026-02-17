import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { navigationItems } from "@/config/navigation";

const labelOverrides: Record<string, string> = {
  "/mpromo": "M-Promo",
  "/mpromo/overview": "Overview",
  "/mpromo/partners": "Partners",
  "/mpromo/campaigns": "Campaigns",
  "/mpromo/codes": "Codes",
  "/mpromo/redemptions": "Redemptions",
  "/mpromo/payouts": "Payouts",
  "/mpromo/orders": "Orders",
  "/mpromo/map": "Map",
  "/mpromo/geo-queue": "Geo Queue",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const navItem = navigationItems.find((item) => item.path === path);
    const label =
      labelOverrides[path] ||
      navItem?.label ||
      segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, path };
  });

  return (
    <nav className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-muted-foreground border-b border-border bg-background overflow-hidden">
      <Link to="/dashboard" className="hover:text-foreground transition-colors shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const isMiddle = !isLast && i < crumbs.length - 1;
        return (
          <span
            key={crumb.path}
            className={`flex items-center gap-1.5 shrink-0 ${isMiddle ? "hidden sm:flex" : ""}`}
          >
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
