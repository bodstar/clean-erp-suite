import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import type { User, Team, AuthResponse, AuthState } from "@/types/auth";
import { toast } from "sonner";

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;

const DEMO_DATA: AuthResponse = {
  token: "demo-token",
  user: { id: 1, name: "Demo User", email: "demo@magvlyn.com" },
  teams: [
    {
      id: 1,
      name: "Magvlyn HQ",
      role: "admin",
      permissions: [
        "dashboard.view",
        "master-data.view",
        "inventory.view",
        "production.view",
        "sales.view",
        "finance.view",
        "franchise.manage",
        "reports.view",
        "settings.view",
        "mpromo.view",
        "mpromo.partners.manage",
        "mpromo.campaign.manage",
        "mpromo.codes.manage",
        "mpromo.redemptions.view",
        "mpromo.payouts.manage",
        "mpromo.orders.view",
        "mpromo.hq.global_view",
        "mpromo.hq.run_campaigns_any_team",
      ],
    },
    {
      id: 2,
      name: "Franchise – Lagos",
      role: "manager",
      permissions: [
        "dashboard.view",
        "inventory.view",
        "production.view",
        "sales.view",
        "reports.view",
        "mpromo.view",
        "mpromo.redemptions.view",
        "mpromo.orders.view",
      ],
    },
  ],
  current_team_id: 1,
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTeam: (teamId: number) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    teams: [],
    currentTeamId: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuth = (data: AuthResponse) => {
    localStorage.setItem("clean-token", data.token);
    localStorage.setItem("clean-team-id", String(data.current_team_id));
    const currentTeam = data.teams.find((t) => t.id === data.current_team_id);
    setState({
      user: data.user,
      teams: data.teams,
      currentTeamId: data.current_team_id,
      permissions: currentTeam?.permissions || [],
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // Session bootstrap
  useEffect(() => {
    if (DEMO_MODE) {
      // Auto-login in demo mode
      setAuth(DEMO_DATA);
      return;
    }
    const token = localStorage.getItem("clean-token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        const data = res.data as AuthResponse;
        const currentTeam = data.teams.find((t) => t.id === data.current_team_id);
        setState({
          user: data.user,
          teams: data.teams,
          currentTeamId: data.current_team_id,
          permissions: currentTeam?.permissions || [],
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem("clean-team-id", String(data.current_team_id));
      })
      .catch(() => {
        localStorage.removeItem("clean-token");
        localStorage.removeItem("clean-team-id");
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, []);

  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      setAuth(DEMO_DATA);
      toast.success("Logged in (Demo Mode)");
      return;
    }
    const res = await api.post("/auth/login", { email, password });
    setAuth(res.data);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("clean-token");
    localStorage.removeItem("clean-team-id");
    setState({
      user: null,
      teams: [],
      currentTeamId: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const switchTeam = async (teamId: number) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      if (DEMO_MODE) {
        const team = DEMO_DATA.teams.find((t) => t.id === teamId);
        localStorage.setItem("clean-team-id", String(teamId));
        setState((s) => ({
          ...s,
          currentTeamId: teamId,
          permissions: team?.permissions || [],
          isLoading: false,
        }));
        toast.success("Team switched successfully");
        return;
      }
      const res = await api.post("/auth/switch-team", { team_id: teamId });
      const { current_team_id, permissions } = res.data;
      localStorage.setItem("clean-team-id", String(current_team_id));
      setState((s) => ({
        ...s,
        currentTeamId: current_team_id,
        permissions: permissions || [],
        isLoading: false,
      }));
      toast.success("Team switched successfully");
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
      toast.error("Failed to switch team");
    }
  };

  const hasPermission = useCallback(
    (permission: string) => state.permissions.includes(permission),
    [state.permissions]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchTeam, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
