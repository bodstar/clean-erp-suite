import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ScopeMode, MPromoScope } from "@/types/mpromo";
import { useAuth } from "@/providers/AuthProvider";

const SHARED_SCOPE_MODE_KEY = "hq.scopeMode";
const SHARED_TARGET_TEAM_KEY = "hq.targetTeamId";

/**
 * @module MPromoScopeProvider
 * Provides shared HQ scope selection for M-Promo views.
 */

interface MPromoScopeContextType {
  scopeMode: ScopeMode;
  targetTeamId: number | null;
  setScopeMode: (mode: ScopeMode) => void;
  setTargetTeamId: (id: number | null) => void;
  scope: MPromoScope;
  canUseGlobalScope: boolean;
}

const MPromoScopeContext = createContext<MPromoScopeContextType | undefined>(undefined);

export function MPromoScopeProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission, currentTeamId, isLoading } = useAuth();
  const canUseGlobalScope = hasPermission("mpromo.hq.global_view");

  const [scopeMode, _setScopeMode] = useState<ScopeMode>(() => {
    const v = localStorage.getItem(SHARED_SCOPE_MODE_KEY) ?? localStorage.getItem("mpromo.scopeMode");
    return (v === "all" || v === "target" || v === "current") ? v : "current";
  });
  const [targetTeamId, _setTargetTeamId] = useState<number | null>(() => {
    const v = localStorage.getItem(SHARED_TARGET_TEAM_KEY) ?? localStorage.getItem("mpromo.targetTeamId");
    return v ? Number(v) : null;
  });

  const setTargetTeamId = useCallback((id: number | null) => {
    _setTargetTeamId(id);
    if (id == null) {
      localStorage.removeItem(SHARED_TARGET_TEAM_KEY);
      localStorage.removeItem("mpromo.targetTeamId");
    } else {
      localStorage.setItem(SHARED_TARGET_TEAM_KEY, String(id));
      localStorage.setItem("mpromo.targetTeamId", String(id));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SHARED_SCOPE_MODE_KEY, scopeMode);
    localStorage.setItem("mpromo.scopeMode", scopeMode);
  }, [scopeMode]);

  // Force back to "current" if user loses global_view (e.g. team switch)
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
      // Auto-select current team when entering "target" mode without a selection
      if (mode === "target" && !targetTeamId && currentTeamId) {
        setTargetTeamId(currentTeamId);
      }
    },
    [canUseGlobalScope, targetTeamId, currentTeamId]
  );

  const scope: MPromoScope = {
    mode: scopeMode,
    targetTeamId: scopeMode === "target" ? targetTeamId : null,
  };

  return (
    <MPromoScopeContext.Provider
      value={{ scopeMode, targetTeamId, setScopeMode, setTargetTeamId, scope, canUseGlobalScope }}
    >
      {children}
    </MPromoScopeContext.Provider>
  );
}

export function useMPromoScope() {
  const ctx = useContext(MPromoScopeContext);
  if (!ctx) throw new Error("useMPromoScope must be used within MPromoScopeProvider");
  return ctx;
}
