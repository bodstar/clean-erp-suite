import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { navigationItems } from "@/config/navigation";

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const navItem = navigationItems.find((item) => item.path === path);
    const label = navItem?.label || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, path };
  });

  return (
    <nav className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-muted-foreground border-b border-border bg-background">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
