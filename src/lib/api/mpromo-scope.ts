/**
 * @module MPromoScopeHelpers
 * Demo-mode tenant scoping helpers for multi-team data filtering.
 * Reads auth state from localStorage since this module has no React context access.
 *
 * In the demo, Team 1 (HQ) has global view access and can see all teams' data,
 * while other teams are restricted to their own data regardless of the requested scope.
 */
import type { MPromoScope } from "@/types/mpromo";
import {
  demoPartners,
  demoCampaigns,
} from "@/lib/demo/mpromo-data";

/** Resolved scope with the user's actual team ID */
interface EffectiveScope {
  mode: "current" | "all" | "target";
  currentTeamId: number;
}

/**
 * Resolves the effective scope for demo mode by reading auth state from localStorage.
 * Non-HQ users are forced to "current" mode regardless of requested scope.
 * @param scope - The requested scope from the UI
 * @returns The effective scope after permission checks
 */
export function resolveEffectiveScope(scope?: MPromoScope): EffectiveScope {
  const currentTeamId = Number(localStorage.getItem("clean-team-id")) || 1;
  const hasGlobalView = checkHasGlobalView();

  if (!hasGlobalView) {
    return { mode: "current", currentTeamId };
  }

  const mode = scope?.mode ?? "current";
  if (mode === "target" && !scope?.targetTeamId) {
    return { mode: "current", currentTeamId };
  }

  return { mode, currentTeamId };
}

/** Check if the current user's team has cross-team visibility (HQ only in demo) */
function checkHasGlobalView(): boolean {
  const token = localStorage.getItem("clean-token");
  if (token !== "demo-token") return false;

  const currentTeamId = Number(localStorage.getItem("clean-team-id")) || 1;
  return currentTeamId === 1;
}

/**
 * Check whether an item's team ID is visible under the given scope.
 * @param teamId - The team ID of the data item
 * @param effectiveScope - The resolved scope
 * @param scope - The original requested scope (needed for target team ID)
 */
export function isAllowedTeam(teamId: number | undefined | null, effectiveScope: EffectiveScope, scope?: MPromoScope): boolean {
  if (effectiveScope.mode === "all") return true;
  if (effectiveScope.mode === "target" && scope?.targetTeamId) {
    return teamId === scope.targetTeamId;
  }
  return teamId === effectiveScope.currentTeamId;
}

// --- Parent lookup maps (lazy singletons for O(1) team lookups) ---

let _campaignTeamMap: Map<number, number> | null = null;
let _partnerTeamMap: Map<number, number> | null = null;

/** Get campaign ID → team ID mapping (built once, cached) */
export function getCampaignTeamMap(): Map<number, number> {
  if (!_campaignTeamMap) {
    _campaignTeamMap = new Map();
    for (const c of demoCampaigns) {
      if (c.team_id != null) _campaignTeamMap.set(c.id, c.team_id);
    }
  }
  return _campaignTeamMap;
}

/** Get partner ID → team ID mapping (built once, cached) */
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

/** Filter items that have a direct `team_id` field */
export function filterByTeamId<T extends { team_id?: number | null }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  return items.filter((item) => isAllowedTeam(item.team_id, es, scope));
}

/** Filter items by looking up their campaign's team via the campaign→team map */
export function filterByCampaignTeam<T extends { campaign_id: number }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  const map = getCampaignTeamMap();
  return items.filter((item) => isAllowedTeam(map.get(item.campaign_id), es, scope));
}

/** Filter items by looking up their partner's team via the partner→team map */
export function filterByPartnerTeam<T extends { partner_id: number }>(
  items: T[],
  scope?: MPromoScope
): T[] {
  const es = resolveEffectiveScope(scope);
  const map = getPartnerTeamMap();
  return items.filter((item) => isAllowedTeam(map.get(item.partner_id), es, scope));
}
