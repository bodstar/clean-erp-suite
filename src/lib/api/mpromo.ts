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

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;

function scopeParams(scope?: MPromoScope): Record<string, string> {
  if (!scope) return {};
  if (scope.mode === "all") return { scope: "all" };
  if (scope.mode === "target" && scope.targetTeamId)
    return { target_team_id: String(scope.targetTeamId) };
  return {};
}

// Demo placeholders
const emptyOverview: MPromoOverview = {
  active_campaigns: 0,
  today_redemptions_count: 0,
  today_redemptions_amount: 0,
  pending_payouts_count: 0,
  pending_payouts_amount: 0,
  orders_today: 0,
  top_chillers: [],
  top_ice_water_sellers: [],
  recent_activity: [],
};

// --- Overview ---
export async function getOverview(scope?: MPromoScope): Promise<MPromoOverview> {
  if (DEMO_MODE) return emptyOverview;
  const res = await api.get("/mpromo/overview", { params: scopeParams(scope) });
  return res.data;
}

// --- Partners ---
export async function getPartners(
  params?: Record<string, unknown>,
  scope?: MPromoScope
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) return { data: [], total: 0 };
  const res = await api.get("/mpromo/partners", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getPartner(id: number): Promise<Partner> {
  if (DEMO_MODE)
    return {
      id,
      name: "",
      phone: "",
      type: "CHILLER",
      location: "",
      status: "active",
      last_activity: null,
      created_at: "",
      updated_at: "",
    };
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
  if (DEMO_MODE) return { data: [], total: 0 };
  const res = await api.get("/mpromo/campaigns", {
    params: { ...params, ...scopeParams(scope) },
  });
  return res.data;
}

export async function getCampaign(id: number): Promise<Campaign> {
  if (DEMO_MODE)
    return {
      id,
      name: "",
      type: "VOLUME_REBATE",
      status: "draft",
      start_date: "",
      end_date: "",
      total_redemptions: 0,
      total_spend: 0,
      created_at: "",
    };
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
  if (DEMO_MODE) return { data: [], total: 0 };
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
  if (DEMO_MODE) return { data: [], total: 0 };
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
  if (DEMO_MODE) return { data: [], total: 0 };
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
  if (DEMO_MODE) return { data: [], total: 0 };
  const res = await api.get("/sales/orders", {
    params: { source: "MPROMO", ...params, ...scopeParams(scope) },
  });
  return res.data;
}

// --- Map ---
export async function getMapPartners(
  params?: Record<string, unknown>
): Promise<MapPartner[]> {
  if (DEMO_MODE) return [];
  const res = await api.get("/mpromo/map/partners", { params });
  return res.data;
}

// --- Geo Queue ---
export async function getPartnersWithoutGeo(
  params?: Record<string, unknown>
): Promise<{ data: Partner[]; total: number }> {
  if (DEMO_MODE) return { data: [], total: 0 };
  const res = await api.get("/mpromo/partners", {
    params: { geo_missing: true, ...params },
  });
  return res.data;
}
