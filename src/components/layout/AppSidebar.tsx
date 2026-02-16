import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { navigationItems } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Droplets } from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const visibleItems = navigationItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-14 flex-row items-center justify-center border-b border-sidebar-border px-3">
        <Droplets className="h-6 w-6 shrink-0 text-sidebar-primary" />
        {!collapsed && (
          <span className="ml-2 text-base font-bold tracking-wide text-sidebar-foreground">
            CLEAN
          </span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
