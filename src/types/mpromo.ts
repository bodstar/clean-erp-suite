export type PartnerType = "CHILLER" | "ICE_WATER_SELLER";
export type PartnerStatus = "active" | "suspended";
export type CampaignType = "VOLUME_REBATE" | "MYSTERY_SHOPPER";
export type CampaignStatus = "draft" | "active" | "paused" | "ended";
export type CodeStatus = "active" | "redeemed" | "expired" | "cancelled";
export type PayoutStatus = "pending" | "paid" | "failed";
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface Partner {
  id: number;
  name: string;
  phone: string;
  type: PartnerType;
  location: string;
  status: PartnerStatus;
  last_activity: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geolocation_captured_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignTier {
  threshold: number;
  reward_amount: number;
}

export interface Campaign {
  id: number;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  tiers?: CampaignTier[];
  reward_amount?: number;
  total_redemptions: number;
  total_spend: number;
  team_id?: number;
  team_name?: string;
  created_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  campaign_id: number;
  campaign_name: string;
  issued_to?: string | null;
  status: CodeStatus;
  expires_at: string;
  redeemed_at?: string | null;
}

export interface Redemption {
  id: number;
  date: string;
  partner_id: number;
  partner_name: string;
  partner_type: PartnerType;
  campaign_id: number;
  campaign_name: string;
  amount: number;
  payout_status: PayoutStatus;
  reference: string;
}

export interface Payout {
  id: number;
  partner_id: number;
  partner_name: string;
  phone: string;
  amount: number;
  status: PayoutStatus;
  paystack_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface MPromoOrder {
  id: number;
  order_no: string;
  partner_id: number;
  partner_name: string;
  date: string;
  total: number;
  status: OrderStatus;
  source: "MPROMO";
  team_id?: number;
  team_name?: string;
}

export interface MPromoOverview {
  active_campaigns: number;
  today_redemptions_count: number;
  today_redemptions_amount: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
  orders_today: number;
  top_chillers: { id: number; name: string; value: number }[];
  top_ice_water_sellers: { id: number; name: string; value: number }[];
  recent_activity: { id: number; type: "redemption" | "order"; description: string; time: string }[];
}

export interface MapPartner {
  id: number;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  phone: string;
  location: string;
  latitude: number;
  longitude: number;
  last_activity: string | null;
  redemptions_count: number;
  redemptions_amount: number;
  orders_count: number;
  orders_amount: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
}

export type ScopeMode = "current" | "all" | "target";

export interface MPromoScope {
  mode: ScopeMode;
  targetTeamId?: number | null;
}
