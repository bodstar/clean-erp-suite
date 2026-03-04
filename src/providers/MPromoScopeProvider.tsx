import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ScopeMode, MPromoScope } from "@/types/mpromo";
import { useAuth } from "@/providers/AuthProvider";

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
  const { hasPermission } = useAuth();
  const canUseGlobalScope = hasPermission("mpromo.hq.global_view");

  const [scopeMode, _setScopeMode] = useState<ScopeMode>("current");
  const [targetTeamId, setTargetTeamId] = useState<number | null>(null);

  // Force back to "current" if user loses global_view (e.g. team switch)
  useEffect(() => {
    if (!canUseGlobalScope && scopeMode !== "current") {
      _setScopeMode("current");
      setTargetTeamId(null);
    }
  }, [canUseGlobalScope, scopeMode]);

  const setScopeMode = useCallback(
    (mode: ScopeMode) => {
      if (!canUseGlobalScope && mode !== "current") {
        // Silently force to current for non-HQ users
        _setScopeMode("current");
        return;
      }
      _setScopeMode(mode);
    },
    [canUseGlobalScope]
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
