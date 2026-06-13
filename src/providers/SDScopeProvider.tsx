import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ScopeMode } from "@/types/mpromo";
import type { SDScope } from "@/types/sd";
import { useAuth } from "@/providers/AuthProvider";

const SHARED_SCOPE_MODE_KEY = "hq.scopeMode";
const SHARED_TARGET_TEAM_KEY = "hq.targetTeamId";

/**
 * @module SDScopeProvider
 * Provides shared HQ scope selection for Sales & Distribution views.
 */

interface SDScopeContextType {
  scopeMode: ScopeMode;
  targetTeamId: number | null;
  setScopeMode: (mode: ScopeMode) => void;
  setTargetTeamId: (id: number | null) => void;
  scope: SDScope;
  canUseGlobalScope: boolean;
}

const SDScopeContext = createContext<SDScopeContextType | undefined>(undefined);

export function SDScopeProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission, currentTeamId, isLoading } = useAuth();
  const canUseGlobalScope = hasPermission("sd.hq.global_view");

  const [scopeMode, _setScopeMode] = useState<ScopeMode>(() => {
    const v = localStorage.getItem(SHARED_SCOPE_MODE_KEY) ?? localStorage.getItem("sd.scopeMode");
    return (v === "all" || v === "target" || v === "current") ? v : "current";
  });
  const [targetTeamId, _setTargetTeamId] = useState<number | null>(() => {
    const v = localStorage.getItem(SHARED_TARGET_TEAM_KEY) ?? localStorage.getItem("sd.targetTeamId");
    return v ? Number(v) : null;
  });

  const setTargetTeamId = useCallback((id: number | null) => {
    _setTargetTeamId(id);
    if (id == null) {
      localStorage.removeItem(SHARED_TARGET_TEAM_KEY);
      localStorage.removeItem("sd.targetTeamId");
    } else {
      localStorage.setItem(SHARED_TARGET_TEAM_KEY, String(id));
      localStorage.setItem("sd.targetTeamId", String(id));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SHARED_SCOPE_MODE_KEY, scopeMode);
    localStorage.setItem("sd.scopeMode", scopeMode);
  }, [scopeMode]);

  useEffect(() => {
    if (isLoading) return;
    if (!canUseGlobalScope && scopeMode !== "current") {
      _setScopeMode("current");
      setTargetTeamId(null);
    }
  }, [canUseGlobalScope, scopeMode, setTargetTeamId, isLoading]);

  const setScopeMode = useCallback(
    (mode: ScopeMode) => {
      if (!canUseGlobalScope && mode !== "current") {
        _setScopeMode("current");
        return;
      }
      _setScopeMode(mode);
      if (mode === "target" && !targetTeamId && currentTeamId) {
        setTargetTeamId(currentTeamId);
      }
    },
    [canUseGlobalScope, targetTeamId, currentTeamId]
  );

  const scope: SDScope = {
    mode: scopeMode,
    targetTeamId: scopeMode === "target" ? targetTeamId : null,
  };

  return (
    <SDScopeContext.Provider
      value={{ scopeMode, targetTeamId, setScopeMode, setTargetTeamId, scope, canUseGlobalScope }}
    >
      {children}
    </SDScopeContext.Provider>
  );
}

export function useSDScope() {
  const ctx = useContext(SDScopeContext);
  if (!ctx) throw new Error("useSDScope must be used within SDScopeProvider");
  return ctx;
}
