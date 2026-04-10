/**
 * @module MPromoAPI
 * API layer for the M-Promo promotional partner management system.
 * In demo mode (no VITE_API_BASE_URL), returns data from in-memory demo stores
 * with full support for multi-team scoping, pagination, and search filtering.
 * In production, delegates to REST API endpoints via axios.
 */

import api from "@/lib/api";
import type {
  MPromoScope,
  MPromoOverview,
  Partner,
  Campaign,
  PromoCode,
  Redemption,
  Payout,
  MPromoOrder,
  MapPartner,
  PointsHistoryEntry,
} from "@/types/mpromo";
import {
  demoPartners,
  demoCampaigns,
  demoCodes,
  demoRedemptions,
  demoPayouts,
  demoOrders,
  demoMapPartners,
  demoPointsHistory,
} from "@/lib/demo/mpromo-data";
import {
  filterByTeamId,
  filterByCampaignTeam,
  filterByPartnerTeam,
  resolveEffectiveScope,
  isAllowedTeam,
  getPartnerTeamMap,
} from "@/lib/api/mpromo-scope";

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 10;

/** Thrown when a user tries to access an entity outside their team scope */
export class AccessDeniedError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

/** Thrown when the requested entity does not exist */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Convert an MPromoScope to URL query parameters for API calls */
function scopeParams(scope?: MPromoScope): Record<string, string> {
  if (!scope) return {};
  if (scope.mode === "all") return { scope: "all" };
  if (scope.mode === "target" && scope.targetTeamId)
    return { target_team_id: String(scope.targetTeamId) };
  return {};
}

/** Paginate an array in demo mode, defaulting to PAGE_SIZE per page */
function paginate<T>(items: T[], params?: Record<string, unknown>): { data: T[]; total: number } {
  const page = Number(params?.page) || 1;
  const size = Number(params?.page_size) || PAGE_SIZE;
  const start = (page - 1) * size;
  return { data: items.slice(start, start + size), total: items.length };
}

/** Case-insensitive substring search across specified fields */
function matchSearch<T>(items: T[], search: string | undefined, keys: (keyof T)[]): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) => keys.some((k) => String(item[k] ?? "").toLowerCase().includes(q)));
}

// --- Overview (computed dynamically in demo) ---
export async function getOverview(scope?: MPromoScope): Promise<MPromoOverview> {
  if (DEMO_MODE) {
    const campaigns = filterByTeamId(demoCampaigns, scope);
    const redemptions = filterByCampaignTeam(demoRedemptions, scope);
    const payouts = filterByPartnerTeam(demoPayouts, scope);
    const orders = filterByTeamId(demoOrders, scope);
    const partners = filterByTeamId(demoPartners, scope);

    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const pendingPayouts = payouts.filter((p) => p.status === "pending");
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRedemptions = redemptions.filter((r) => r.date.startsWith(todayStr));
    const todayOrders = orders.filter((o) => o.date.startsWith(todayStr));

    // Top partners by redemption amount
    const chillerMap = new Map<number, { name: string; value: number; team_name?: string }>();
    const iwsMap = new Map<number, { name: string; value: number; team_name?: string }>();
    for (const r of redemptions) {
      const p = partners.find((p) => p.id === r.partner_id);
      if (!p) continue;
      const map = p.type === "CHILLER" ? chillerMap : iwsMap;
      const existing = map.get(r.partner_id);
      if (existing) existing.value += r.amount;
      else map.set(r.partner_id, { name: r.partner_name, value: r.amount, team_name: p.team_name });
    }

    const topChillers = [...chillerMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const topIWS = [...iwsMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top loyalty points
    const topLoyalty = [...partners]
      .filter((p) => p.loyalty_points > 0)
      .sort((a, b) => b.loyalty_points - a.loyalty_points)
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, type: p.type, points: p.loyalty_points, team_name: p.team_name }));

    // Recent activity from filtered data
    const es = resolveEffectiveScope(scope);
    const ptMap = getPartnerTeamMap();
    const recentActivity = [
      ...redemptions.slice(0, 3).map((r, i) => ({
        id: i + 1,
        type: "redemption" as const,
        partner_id: r.partner_id,
        partner_name: r.partner_name,
        description: `${r.partner_name} redeemed GH₵${r.amount.toLocaleString()} from ${r.campaign_name}`,
        time: r.date,
        team_name: r.team_name,
      })),
      ...orders.slice(0, 2).map((o, i) => ({
        id: i + 100,
        type: "order" as const,
        partner_id: o.partner_id,
        partner_name: o.partner_name,
        description: `New order ${o.order_no} from ${o.partner_name} — GH₵${o.total.toLocaleString()}`,
        time: o.date,
        team_name: o.team_name,
      })),
    ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

    return {
      active_campaigns: activeCampaigns,
      today_redemptions_count: todayRedemptions.length,
      today_redemptions_amount: todayRedemptions.reduce((s, r) => s + r.amount, 0),
      pending_payouts_count: pendingPayouts.length,
      pending_payouts_amount: pendingPayouts.reduce((s, p) => s + p.amount, 0),
      orders_today: todayOrders.length,
      top_chillers: topChillers,
      top_ice_water_sellers: topIWS,
      top_loyalty: topLoyalty,
      recent_activity: recentActivity,
    };
  }
  const res = await api.get("/mpromo/overview", { params: scopeParams(scope) });
  return res.data;
}

// --- Partners ---
export async function getPartners(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId([...demoPartners], scope);
    if (params?.type) filtered = filtered.filter((p) => p.type === params.type);
    if (params?.geo_missing) filtered = filtered.filter((p) => !p.latitude);
    filtered = matchSearch(filtered, params?.search as string, ["name", "location", "phone"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/partners", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getPartner(id: number, scope?: MPromoScope): Promise<Partner> {
  if (DEMO_MODE) {
    const allowed = filterByTeamId(demoPartners, scope);
    const found = allowed.find((p) => p.id === id);
    if (found) return found;
    // Entity exists but not in user's scope — throw access denied
    const any = demoPartners.find((p) => p.id === id);
    if (any) throw new AccessDeniedError("You do not have access to this partner.");
    throw new NotFoundError("Partner not found.");
  }
  const res = await api.get(`/mpromo/partners/${id}`);
  return res.data;
}

export async function createPartner(
  data: Partial<Partner>,
  scope?: MPromoScope
): Promise<Partner> {
  const res = await api.post("/mpromo/partners", data, {
    params: scopeParams(scope),
  });
  return res.data;
}

export async function importPartners(
  rows: Array<{
    name: string;
    phone: string;
    type: string;
    location: string;
    latitude?: number;
    longitude?: number;
  }>,
  scope?: MPromoScope
): Promise<{ imported: number; failed: number; errors: Record<string, string> }> {
  if (DEMO_MODE) {
    const seen = new Set<string>();
    let imported = 0;
    let failed = 0;
    const errors: Record<string, string> = {};
    rows.forEach((row, i) => {
      if (seen.has(row.phone)) {
        failed++;
        errors[String(i)] = "Phone number already registered under this team";
      } else {
        seen.add(row.phone);
        imported++;
      }
    });
    return { imported, failed, errors };
  }
  const res = await api.post("/mpromo/partners/import", { rows }, {
    params: scopeParams(scope),
  });
  return res.data;
}

export async function updatePartner(
  id: number,
  data: Partial<Partner>
): Promise<Partner> {
  const res = await api.put(`/mpromo/partners/${id}`, data);
  return res.data;
}

export async function suspendPartner(id: number): Promise<void> {
  await api.post(`/mpromo/partners/${id}/suspend`);
}

export async function activatePartner(id: number): Promise<void> {
  await api.post(`/mpromo/partners/${id}/activate`);
}

export async function updatePartnerGeolocation(
  id: number,
  data: { latitude: number; longitude: number }
): Promise<void> {
  await api.put(`/mpromo/partners/${id}/geolocation`, data);
}

export async function adjustPartnerPoints(
  id: number,
  data: { type: "add" | "deduct"; amount: number; reason: string }
): Promise<{ new_balance: number }> {
  if (DEMO_MODE) {
    const partner = demoPartners.find((p) => p.id === id);
    if (!partner) throw new NotFoundError("Partner not found.");
    const delta = data.type === "add" ? data.amount : -data.amount;
    partner.loyalty_points = Math.max(0, partner.loyalty_points + delta);
    return { new_balance: partner.loyalty_points };
  }
  const res = await api.post(`/mpromo/partners/${id}/adjust-points`, data);
  return res.data;
}

// --- Partner Points History ---
export async function getPartnerPointsHistory(partnerId: number): Promise<PointsHistoryEntry[]> {
  if (DEMO_MODE) {
    // Filter demo redemptions for this partner, then map to points history
    const partnerRedemptions = demoRedemptions.filter((r) => r.partner_id === partnerId);
    const campaignPoints: Record<number, number> = {};
    for (const c of demoCampaigns) {
      if (c.type === "MYSTERY_SHOPPER" && c.loyalty_points) {
        campaignPoints[c.id] = c.loyalty_points;
      } else if (c.type === "VOLUME_REBATE" && c.tiers?.length) {
        campaignPoints[c.id] = c.tiers[0].loyalty_points;
      }
    }
    const redemptionEntries: PointsHistoryEntry[] = partnerRedemptions.map((r, i) => ({
      id: i + 1,
      date: r.date,
      points: campaignPoints[r.campaign_id] || 10,
      type: "earned" as const,
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      redemption_id: r.id,
      adjusted_by_name: null,
      reason: null,
      description: `Earned from ${r.campaign_name} redemption`,
    }));
    // Include any manual adjustment entries from demo data for this partner
    const manualEntries = demoPointsHistory.filter(
      (e) => e.campaign_id === null
    );
    const allEntries = [...redemptionEntries, ...manualEntries];
    return allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  const res = await api.get(`/mpromo/partners/${partnerId}/points-history`);
  return res.data.data;
}

// --- Campaigns ---
export async function getCampaigns(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Campaign[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId([...demoCampaigns], scope);
    if (params?.status) filtered = filtered.filter((c) => c.status === params.status);
    filtered = matchSearch(filtered, params?.search as string, ["name"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/campaigns", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getCampaign(id: number, scope?: MPromoScope): Promise<Campaign> {
  if (DEMO_MODE) {
    const allowed = filterByTeamId(demoCampaigns, scope);
    const found = allowed.find((c) => c.id === id);
    if (found) return found;
    const any = demoCampaigns.find((c) => c.id === id);
    if (any) throw new AccessDeniedError("You do not have access to this campaign.");
    throw new NotFoundError("Campaign not found.");
  }
  const res = await api.get(`/mpromo/campaigns/${id}`);
  return res.data;
}

export async function createCampaign(
  data: Partial<Campaign>,
  scope?: MPromoScope
): Promise<Campaign> {
  const res = await api.post("/mpromo/campaigns", data, {
    params: scopeParams(scope),
  });
  return res.data;
}

export async function activateCampaign(id: number): Promise<void> {
  await api.post(`/mpromo/campaigns/${id}/activate`);
}

export async function pauseCampaign(id: number): Promise<void> {
  await api.post(`/mpromo/campaigns/${id}/pause`);
}

export async function endCampaign(id: number): Promise<void> {
  await api.post(`/mpromo/campaigns/${id}/end`);
}

// --- Code Batches ---
export interface CodeBatch {
  id: number;
  campaign_id: number;
  campaign_name: string;
  team_id?: number;
  team_name?: string;
  quantity: number;
  redemption_amount: number;
  expires_at: string;
  generated_by_name: string;
  redeemed_count: number;
  active_count: number;
  codes?: PromoCode[];
  created_at: string;
}

export async function getCodeBatches(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: CodeBatch[]; total: number }> {
  if (DEMO_MODE) {
    // Synthesize batches from demo codes grouped by campaign_id + expires_at
    const batchMap = new Map<string, CodeBatch>();
    for (const code of filterByCampaignTeam(demoCodes, scope)) {
      const campaign = demoCampaigns.find((c) => c.id === code.campaign_id);
      const key = `${code.campaign_id}-${code.expires_at}`;
      if (!batchMap.has(key)) {
        batchMap.set(key, {
          id: code.campaign_id * 1000 + batchMap.size + 1,
          campaign_id: code.campaign_id,
          campaign_name: code.campaign_name,
          team_id: campaign?.team_id,
          team_name: campaign?.team_name,
          quantity: 0,
          redemption_amount: code.redemption_amount,
          expires_at: code.expires_at,
          generated_by_name: "Demo Admin",
          redeemed_count: 0,
          active_count: 0,
          codes: [],
          created_at: campaign?.created_at || code.expires_at,
        });
      }
      const batch = batchMap.get(key)!;
      batch.quantity++;
      batch.codes!.push({ ...code, team_id: campaign?.team_id, team_name: campaign?.team_name });
      if (code.status === "redeemed") batch.redeemed_count++;
      if (code.status === "active") batch.active_count++;
    }
    let batches = Array.from(batchMap.values());
    batches = matchSearch(batches, params?.search as string, ["campaign_name"]);
    batches.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return paginate(batches, params);
  }
  const res = await api.get("/mpromo/codes/batches", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getCodeBatch(id: number): Promise<CodeBatch> {
  if (DEMO_MODE) {
    // Rebuild all batches and find the one with matching id
    const batchMap = new Map<string, CodeBatch>();
    for (const code of demoCodes) {
      const campaign = demoCampaigns.find((c) => c.id === code.campaign_id);
      const key = `${code.campaign_id}-${code.expires_at}`;
      if (!batchMap.has(key)) {
        batchMap.set(key, {
          id: code.campaign_id * 1000 + batchMap.size + 1,
          campaign_id: code.campaign_id,
          campaign_name: code.campaign_name,
          team_id: campaign?.team_id,
          team_name: campaign?.team_name,
          quantity: 0,
          redemption_amount: code.redemption_amount,
          expires_at: code.expires_at,
          generated_by_name: "Demo Admin",
          redeemed_count: 0,
          active_count: 0,
          codes: [],
          created_at: campaign?.created_at || code.expires_at,
        });
      }
      const batch = batchMap.get(key)!;
      batch.quantity++;
      batch.codes!.push({ ...code, team_id: campaign?.team_id, team_name: campaign?.team_name });
      if (code.status === "redeemed") batch.redeemed_count++;
      if (code.status === "active") batch.active_count++;
    }
    const found = Array.from(batchMap.values()).find((b) => b.id === id);
    if (found) return found;
    throw new NotFoundError("Batch not found.");
  }
  const res = await api.get(`/mpromo/codes/batches/${id}`);
  return res.data;
}

// --- Codes ---
export async function getCodes(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: PromoCode[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByCampaignTeam([...demoCodes], scope);
    filtered = matchSearch(filtered, params?.search as string, ["code", "campaign_name", "issued_to"]);
    // Enrich with team info from parent campaign
    const enriched = filtered.map((c) => {
      const campaign = demoCampaigns.find((camp) => camp.id === c.campaign_id);
      return { ...c, team_id: campaign?.team_id, team_name: campaign?.team_name };
    });
    return paginate(enriched, params);
  }
  const res = await api.get("/mpromo/codes", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function generateCodes(
  data: { campaign_id: number; quantity: number; expires_at: string; redemption_amount: number },
  scope?: MPromoScope
): Promise<{ count: number; batch_id: number }> {
  if (DEMO_MODE) {
    return { count: data.quantity, batch_id: Date.now() };
  }
  const res = await api.post("/mpromo/codes/generate", data, {
    params: scopeParams(scope),
  });
  return res.data;
}

// --- Redemptions ---
export async function getRedemptions(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Redemption[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByCampaignTeam([...demoRedemptions], scope);
    filtered = matchSearch(filtered, params?.search as string, ["partner_name", "campaign_name", "reference"]);
    // Enrich with team info from parent campaign
    const enriched = filtered.map((r) => {
      const campaign = demoCampaigns.find((c) => c.id === r.campaign_id);
      return { ...r, team_id: campaign?.team_id, team_name: campaign?.team_name };
    });
    return paginate(enriched, params);
  }
  const res = await api.get("/mpromo/redemptions", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

// --- Payouts ---
export async function getPayouts(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Payout[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByPartnerTeam([...demoPayouts], scope);
    filtered = matchSearch(filtered, params?.search as string, ["partner_name", "phone"]);
    // Enrich with team info from parent partner
    const enriched = filtered.map((p) => {
      const partner = demoPartners.find((pt) => pt.id === p.partner_id);
      return { ...p, team_id: partner?.team_id, team_name: partner?.team_name };
    });
    return paginate(enriched, params);
  }
  const res = await api.get("/mpromo/payouts", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function payPayout(id: number, scope?: MPromoScope): Promise<void> {
  await api.post(`/mpromo/payouts/${id}/pay`, null, {
    params: scopeParams(scope),
  });
}

// --- Orders ---
export async function getOrders(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: MPromoOrder[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId([...demoOrders], scope);
    filtered = matchSearch(filtered, params?.search as string, ["order_no", "partner_name"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/sales/orders", {
    params: { source: "MPROMO", ...params, ...scopeParams(scope) },
  });
  return res.data;
}

// --- Map ---
export async function getMapPartners(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<MapPartner[]> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId([...demoMapPartners], scope);
    if (params?.type) filtered = filtered.filter((p) => p.type === params.type);
    if (params?.status) filtered = filtered.filter((p) => p.status === params.status);
    filtered = matchSearch(filtered, params?.search as string, ["name", "location"]);
    return filtered;
  }
  const res = await api.get("/mpromo/map/partners", { params });
  return res.data;
}

// --- Partner-scoped data (for detail page) ---
export async function getPartnerRedemptions(
  partnerId: number,
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Redemption[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByCampaignTeam(demoRedemptions, scope);
    filtered = filtered.filter((r) => r.partner_id === partnerId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/partners/${partnerId}/redemptions`, { params });
  return res.data;
}

export async function getPartnerOrders(
  partnerId: number,
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: MPromoOrder[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId(demoOrders, scope);
    filtered = filtered.filter((o) => o.partner_id === partnerId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/partners/${partnerId}/orders`, { params });
  return res.data;
}

// --- Campaign-scoped data (for detail page) ---
export async function getCampaignCodes(
  campaignId: number,
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: PromoCode[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByCampaignTeam(demoCodes, scope);
    filtered = filtered.filter((c) => c.campaign_id === campaignId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/campaigns/${campaignId}/codes`, { params });
  return res.data;
}

export async function getCampaignCodeBatches(
  campaignId: number,
  scope?: MPromoScope
): Promise<CodeBatch[]> {
  if (DEMO_MODE) {
    // Reuse getCodeBatches logic but filter to this campaign
    const { data } = await getCodeBatches({ page_size: 100 }, scope);
    return data.filter((b) => b.campaign_id === campaignId);
  }
  const res = await api.get(`/mpromo/campaigns/${campaignId}/codes/batches`, {
    params: scopeParams(scope),
  });
  return res.data.data;
}

export async function getCampaignRedemptions(
  campaignId: number,
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Redemption[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByCampaignTeam(demoRedemptions, scope);
    filtered = filtered.filter((r) => r.campaign_id === campaignId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/campaigns/${campaignId}/redemptions`, { params });
  return res.data;
}

// --- Geo Queue ---
export async function getPartnersWithoutGeo(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByTeamId(demoPartners, scope).filter((p) => !p.latitude);
    if (params?.type) filtered = filtered.filter((p) => p.type === params.type);
    filtered = matchSearch(filtered, params?.search as string, ["name", "location"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/partners", {
    params: { geo_missing: true, ...params },
  });
  return res.data;
}
