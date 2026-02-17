import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sun, Moon, Bell, User, LogOut, ChevronsUpDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { user, teams, currentTeamId, logout, switchTeam } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const showTeamSwitcher = teams.length > 1;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isMobile) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />

        {currentTeam && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary font-medium text-xs px-2.5 py-0.5"
          >
            {currentTeam.name}
          </Badge>
        )}

        <div className="flex-1" />

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle className="text-sm">Menu</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col">
              {/* User info */}
              <div className="px-4 py-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Separator />

              {/* Team Switcher */}
              {showTeamSwitcher && (
                <>
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Switch Team</p>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => switchTeam(team.id)}
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent ${
                          team.id === currentTeamId ? "bg-accent" : ""
                        }`}
                      >
                        {team.name}
                        <span className="text-xs text-muted-foreground">{team.role}</span>
                      </button>
                    ))}
                  </div>
                  <Separator />
                </>
              )}

              {/* Actions */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent">
                <Bell className="h-4 w-4" />
                Notifications
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <Separator />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />

      {currentTeam && (
        <Badge
          variant="secondary"
          className="ml-2 bg-primary/10 text-primary font-medium text-xs px-2.5 py-0.5"
        >
          {currentTeam.name}
        </Badge>
      )}

      <div className="flex-1" />

      {/* Team Switcher */}
      {showTeamSwitcher && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Switch Team
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Your Teams</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => switchTeam(team.id)}
                className={team.id === currentTeamId ? "bg-accent" : ""}
              >
                {team.name}
                <span className="ml-auto text-xs text-muted-foreground">{team.role}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
        {theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <User className="h-4 w-4" />
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
