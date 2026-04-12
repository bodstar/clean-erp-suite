import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ScopeMode } from "@/types/mpromo";
import type { SDScope } from "@/types/sd";
import { useAuth } from "@/providers/AuthProvider";

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
  const { hasPermission, currentTeamId } = useAuth();
  const canUseGlobalScope = hasPermission("sd.hq.global_view");

  const [scopeMode, _setScopeMode] = useState<ScopeMode>("current");
  const [targetTeamId, setTargetTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!canUseGlobalScope && scopeMode !== "current") {
      _setScopeMode("current");
      setTargetTeamId(null);
    }
  }, [canUseGlobalScope, scopeMode]);

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
