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
} from "@/types/mpromo";
import {
  demoPartners,
  demoCampaigns,
  demoCodes,
  demoRedemptions,
  demoPayouts,
  demoOrders,
  demoMapPartners,
  demoOverview,
} from "@/lib/demo/mpromo-data";

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 10;

function scopeParams(scope?: MPromoScope): Record<string, string> {
  if (!scope) return {};
  if (scope.mode === "all") return { scope: "all" };
  if (scope.mode === "target" && scope.targetTeamId)
    return { target_team_id: String(scope.targetTeamId) };
  return {};
}

// --- Demo helpers ---
function paginate<T>(items: T[], params?: Record<string, unknown>): { data: T[]; total: number } {
  const page = Number(params?.page) || 1;
  const size = Number(params?.page_size) || PAGE_SIZE;
  const start = (page - 1) * size;
  return { data: items.slice(start, start + size), total: items.length };
}

function matchSearch<T>(items: T[], search: string | undefined, keys: (keyof T)[]): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) => keys.some((k) => String(item[k] ?? "").toLowerCase().includes(q)));
}

// --- Overview ---
export async function getOverview(scope?: MPromoScope): Promise<MPromoOverview> {
  if (DEMO_MODE) return demoOverview;
  const res = await api.get("/mpromo/overview", { params: scopeParams(scope) });
  return res.data;
}

// --- Partners ---
export async function getPartners(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = [...demoPartners];
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

export async function getPartner(id: number): Promise<Partner> {
  if (DEMO_MODE) {
    const found = demoPartners.find((p) => p.id === id);
    if (found) return found;
    return { id, name: "", phone: "", type: "CHILLER", location: "", status: "active", last_activity: null, created_at: "", updated_at: "" };
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

// --- Campaigns ---
export async function getCampaigns(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Campaign[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = [...demoCampaigns];
    if (params?.status) filtered = filtered.filter((c) => c.status === params.status);
    filtered = matchSearch(filtered, params?.search as string, ["name"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/campaigns", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getCampaign(id: number): Promise<Campaign> {
  if (DEMO_MODE) {
    const found = demoCampaigns.find((c) => c.id === id);
    if (found) return found;
    return { id, name: "", type: "VOLUME_REBATE", status: "draft", start_date: "", end_date: "", total_redemptions: 0, total_spend: 0, created_at: "" };
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

// --- Codes ---
export async function getCodes(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: PromoCode[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = [...demoCodes];
    filtered = matchSearch(filtered, params?.search as string, ["code", "campaign_name", "issued_to"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/codes", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function generateCodes(
  data: { campaign_id: number; quantity: number; expires_at: string },
  scope?: MPromoScope
): Promise<{ count: number }> {
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
    let filtered = [...demoRedemptions];
    filtered = matchSearch(filtered, params?.search as string, ["partner_name", "campaign_name", "reference"]);
    return paginate(filtered, params);
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
    let filtered = [...demoPayouts];
    filtered = matchSearch(filtered, params?.search as string, ["partner_name", "phone"]);
    return paginate(filtered, params);
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

// --- Orders (aligned with Sales module) ---
export async function getOrders(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: MPromoOrder[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = [...demoOrders];
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
  params?: Record<string, unknown>
): Promise<MapPartner[]> {
  if (DEMO_MODE) {
    let filtered = [...demoMapPartners];
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
  params?: Record<string, unknown>
): Promise<{ data: Redemption[]; total: number }> {
  if (DEMO_MODE) {
    const filtered = demoRedemptions.filter((r) => r.partner_id === partnerId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/partners/${partnerId}/redemptions`, { params });
  return res.data;
}

export async function getPartnerOrders(
  partnerId: number,
  params?: Record<string, unknown>
): Promise<{ data: MPromoOrder[]; total: number }> {
  if (DEMO_MODE) {
    const filtered = demoOrders.filter((o) => o.partner_id === partnerId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/partners/${partnerId}/orders`, { params });
  return res.data;
}

// --- Campaign-scoped data (for detail page) ---
export async function getCampaignCodes(
  campaignId: number,
  params?: Record<string, unknown>
): Promise<{ data: PromoCode[]; total: number }> {
  if (DEMO_MODE) {
    const filtered = demoCodes.filter((c) => c.campaign_id === campaignId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/campaigns/${campaignId}/codes`, { params });
  return res.data;
}

export async function getCampaignRedemptions(
  campaignId: number,
  params?: Record<string, unknown>
): Promise<{ data: Redemption[]; total: number }> {
  if (DEMO_MODE) {
    const filtered = demoRedemptions.filter((r) => r.campaign_id === campaignId);
    return paginate(filtered, params);
  }
  const res = await api.get(`/mpromo/campaigns/${campaignId}/redemptions`, { params });
  return res.data;
}

// --- Geo Queue ---
export async function getPartnersWithoutGeo(
  params?: Record<string, unknown>
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = demoPartners.filter((p) => !p.latitude);
    if (params?.type) filtered = filtered.filter((p) => p.type === params.type);
    filtered = matchSearch(filtered, params?.search as string, ["name", "location"]);
    return paginate(filtered, params);
  }
  const res = await api.get("/mpromo/partners", {
    params: { geo_missing: true, ...params },
  });
  return res.data;
}
