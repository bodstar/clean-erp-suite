/**
 * @module MPromoTypes
 * Core type definitions for the M-Promo promotional partner management system.
 * Covers partners, campaigns, promo codes, redemptions, payouts, orders,
 * map data, loyalty points, and multi-team scoping.
 */

/** Partner classification — CHILLER (cold storage) or ICE_WATER_SELLER (street vendor) */
export type PartnerType = "CHILLER" | "ICE_WATER_SELLER";

/** Partner account status */
export type PartnerStatus = "active" | "suspended";

/** Campaign incentive model */
export type CampaignType = "VOLUME_REBATE" | "MYSTERY_SHOPPER";

/** Campaign lifecycle state */
export type CampaignStatus = "draft" | "active" | "paused" | "ended";

/** Promo code lifecycle state */
export type CodeStatus = "active" | "redeemed" | "expired" | "cancelled";

/** Financial payout state */
export type PayoutStatus = "pending" | "paid" | "failed";

/** Order fulfillment state */
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

/** A registered partner in the M-Promo network */
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
  /** When the partner's GPS coordinates were first recorded */
  geolocation_captured_at?: string | null;
  loyalty_points: number;
  /** Team that owns this partner (multi-tenant) */
  team_id?: number;
  team_name?: string;
  created_at: string;
  updated_at: string;
}

/** A reward tier within a VOLUME_REBATE campaign */
export interface CampaignTier {
  /** Minimum volume to qualify */
  threshold: number;
  /** Cash reward at this tier */
  reward_amount: number;
  /** Loyalty points awarded at this tier */
  loyalty_points: number;
}

/** A promotional campaign targeting partners */
export interface Campaign {
  id: number;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  /** Volume-based reward tiers (VOLUME_REBATE only) */
  tiers?: CampaignTier[];
  /** Flat reward amount (MYSTERY_SHOPPER only) */
  reward_amount?: number;
  /** Flat loyalty points (MYSTERY_SHOPPER only) */
  loyalty_points?: number;
  total_redemptions: number;
  total_spend: number;
  team_id?: number;
  team_name?: string;
  created_at: string;
}

/** A unique promo code tied to a campaign */
export interface PromoCode {
  id: number;
  code: string;
  campaign_id: number;
  campaign_name: string;
  /** Partner the code was issued to (null = unassigned) */
  issued_to?: string | null;
  status: CodeStatus;
  expires_at: string;
  redeemed_at?: string | null;
  redemption_amount: number;
  team_id?: number;
  team_name?: string;
}

/** A record of a partner redeeming a promo code */
export interface Redemption {
  id: number;
  date: string;
  code_id: number;
  code: string;
  partner_id: number;
  partner_name: string;
  partner_type: PartnerType;
  campaign_id: number;
  campaign_name: string;
  amount: number;
  payout_status: PayoutStatus;
  reference: string;
  team_id?: number;
  team_name?: string;
}

/** A financial payout to a partner */
export interface Payout {
  id: number;
  partner_id: number;
  partner_name: string;
  phone: string;
  amount: number;
  status: PayoutStatus;
  /** Paystack transaction reference */
  paystack_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
  team_id?: number;
  team_name?: string;
}

/** An order placed through the M-Promo channel */
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

/** Aggregated dashboard KPIs for the M-Promo overview page */
export interface MPromoOverview {
  active_campaigns: number;
  today_redemptions_count: number;
  today_redemptions_amount: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
  orders_today: number;
  top_chillers: { id: number; name: string; value: number; team_name?: string }[];
  top_ice_water_sellers: { id: number; name: string; value: number; team_name?: string }[];
  top_loyalty: { id: number; name: string; type: PartnerType; points: number; team_name?: string }[];
  recent_activity: { id: number; type: "redemption" | "order"; description: string; time: string; partner_id?: number; partner_name?: string; team_name?: string }[];
}

/**
 * A partner with geographic coordinates and aggregated metrics,
 * used for map marker rendering and heatmap visualization.
 */
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
  loyalty_points: number;
  team_id?: number;
  team_name?: string;
  /** Pre-aggregated form metric data: formId → fieldId → aggregated value */
  form_data?: Record<string, Record<string, number>>;
}

/** A single entry in a partner's loyalty points history */
export interface PointsHistoryEntry {
  id: number;
  date: string;
  points: number;
  /** Whether points were earned (positive) or deducted (negative/manual) */
  type: "earned" | "deducted";
  /** Campaign that generated the points (null for manual adjustments) */
  campaign_id: number | null;
  campaign_name: string | null;
  /** Redemption that triggered the entry (null for manual adjustments) */
  redemption_id: number | null;
  /** Name of the admin who performed a manual adjustment (null for redemption entries) */
  adjusted_by_name: string | null;
  /** Reason provided for a manual adjustment */
  reason: string | null;
  description: string;
}

/** Team scope mode for multi-tenant data filtering */
export type ScopeMode = "current" | "all" | "target";

/** Describes which team's data should be shown */
export interface MPromoScope {
  /** "current" = user's own team, "all" = cross-team (HQ only), "target" = specific team */
  mode: ScopeMode;
  /** Required when mode is "target" */
  targetTeamId?: number | null;
}
