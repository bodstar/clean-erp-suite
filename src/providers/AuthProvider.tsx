import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import type { User, Team, AuthResponse, AuthState } from "@/types/auth";
import { toast } from "sonner";

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
    const token = localStorage.getItem("clean-token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        const data = res.data as AuthResponse;
        // Keep existing token since /me may not return one
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
