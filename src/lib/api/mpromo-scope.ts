/**
 * Demo-mode tenant scoping helpers.
 * Reads auth state from localStorage since this module has no React context access.
 */
import type { MPromoScope } from "@/types/mpromo";
import {
  demoPartners,
  demoCampaigns,
} from "@/lib/demo/mpromo-data";

// --- Effective scope resolution ---

interface EffectiveScope {
  mode: "current" | "all" | "target";
  currentTeamId: number;
}

/**
 * Resolves the effective scope for demo mode by reading auth state from localStorage.
 * Non-HQ users are forced to "current" mode regardless of requested scope.
 */
export function resolveEffectiveScope(scope?: MPromoScope): EffectiveScope {
  const currentTeamId = Number(localStorage.getItem("clean-team-id")) || 1;
  const hasGlobalView = checkHasGlobalView();

  if (!hasGlobalView) {
    // Non-HQ: always forced to current team
    return { mode: "current", currentTeamId };
  }

  const mode = scope?.mode ?? "current";
  if (mode === "target" && !scope?.targetTeamId) {
    return { mode: "current", currentTeamId };
  }

  return { mode, currentTeamId };
}

function checkHasGlobalView(): boolean {
  // Parse demo teams from the token approach — in demo mode we check localStorage
  // We need to find the current team's permissions
  const token = localStorage.getItem("clean-token");
  if (token !== "demo-token") return false;

  const currentTeamId = Number(localStorage.getItem("clean-team-id")) || 1;
  // Team 1 (HQ) has global_view; others don't. This mirrors DEMO_DATA in AuthProvider.
  return currentTeamId === 1;
}

// --- Team predicate ---

export function isAllowedTeam(teamId: number | undefined | null, effectiveScope: EffectiveScope, scope?: MPromoScope): boolean {
  if (effectiveScope.mode === "all") return true;
  if (effectiveScope.mode === "target" && scope?.targetTeamId) {
    return teamId === scope.targetTeamId;
  }
  // "current" mode
  return teamId === effectiveScope.currentTeamId;
}

// --- Parent lookup maps (lazy singletons) ---

let _campaignTeamMap: Map<number, number> | null = null;
let _partnerTeamMap: Map<number, number> | null = null;

export function getCampaignTeamMap(): Map<number, number> {
  if (!_campaignTeamMap) {
    _campaignTeamMap = new Map();
    for (const c of demoCampaigns) {
      if (c.team_id != null) _campaignTeamMap.set(c.id, c.team_id);
    }
  }
  return _campaignTeamMap;
}

export function getPartnerTeamMap(): Map<number, number> {
  if (!_partnerTeamMap) {
    _partnerTeamMap = new Map();
    for (const p of demoPartners) {
      if (p.team_id != null) _partnerTeamMap.set(p.id, p.team_id);
    }
  }
  return _partnerTeamMap;
}

// --- Generic filter helpers ---

export function filterByTeamId<T extends { team_id?: number | null }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  return items.filter((item) => isAllowedTeam(item.team_id, es, scope));
}

export function filterByCampaignTeam<T extends { campaign_id: number }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  const map = getCampaignTeamMap();
  return items.filter((item) => isAllowedTeam(map.get(item.campaign_id), es, scope));
}

export function filterByPartnerTeam<T extends { partner_id: number }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  const map = getPartnerTeamMap();
  return items.filter((item) => isAllowedTeam(map.get(item.partner_id), es, scope));
}
