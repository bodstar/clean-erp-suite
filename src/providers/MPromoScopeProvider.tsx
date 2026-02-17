import React, { createContext, useContext, useState } from "react";
import type { ScopeMode, MPromoScope } from "@/types/mpromo";

interface MPromoScopeContextType {
  scopeMode: ScopeMode;
  targetTeamId: number | null;
  setScopeMode: (mode: ScopeMode) => void;
  setTargetTeamId: (id: number | null) => void;
  scope: MPromoScope;
}

const MPromoScopeContext = createContext<MPromoScopeContextType | undefined>(undefined);

export function MPromoScopeProvider({ children }: { children: React.ReactNode }) {
  const [scopeMode, setScopeMode] = useState<ScopeMode>("current");
  const [targetTeamId, setTargetTeamId] = useState<number | null>(null);

  const scope: MPromoScope = {
    mode: scopeMode,
    targetTeamId: scopeMode === "target" ? targetTeamId : null,
  };

  return (
    <MPromoScopeContext.Provider
      value={{ scopeMode, targetTeamId, setScopeMode, setTargetTeamId, scope }}
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
