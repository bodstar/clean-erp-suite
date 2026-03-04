import { subDays, subHours, addDays, format } from "date-fns";
import type {
  Partner,
  Campaign,
  PromoCode,
  Redemption,
  Payout,
  MPromoOrder,
  MapPartner,
  MPromoOverview,
} from "@/types/mpromo";

const now = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const fmtTime = (d: Date) => format(d, "yyyy-MM-dd HH:mm");

// --- Partners (12) ---
export const demoPartners: Partner[] = [
  { id: 1, name: "Kwame Asante Chiller Hub", phone: "+233241000001", type: "CHILLER", location: "Osu, Accra", status: "active", last_activity: fmtTime(subHours(now, 2)), latitude: 5.5560, longitude: -0.1820, geolocation_captured_at: fmt(subDays(now, 30)), created_at: fmt(subDays(now, 120)), updated_at: fmt(subDays(now, 2)) },
  { id: 2, name: "Amina Ice Water Express", phone: "+233241000002", type: "ICE_WATER_SELLER", location: "Madina, Accra", status: "active", last_activity: fmtTime(subHours(now, 5)), latitude: 5.6700, longitude: -0.1674, geolocation_captured_at: fmt(subDays(now, 25)), created_at: fmt(subDays(now, 100)), updated_at: fmt(subDays(now, 1)) },
  { id: 3, name: "Akosua Cold Drinks", phone: "+233241000003", type: "CHILLER", location: "Cantonments, Accra", status: "active", last_activity: fmtTime(subHours(now, 8)), latitude: 5.5620, longitude: -0.1730, geolocation_captured_at: fmt(subDays(now, 15)), created_at: fmt(subDays(now, 90)), updated_at: fmt(subDays(now, 3)) },
  { id: 4, name: "Efua Pure Water", phone: "+233241000004", type: "ICE_WATER_SELLER", location: "East Legon, Accra", status: "active", last_activity: fmtTime(subDays(now, 1)), latitude: 5.6380, longitude: -0.1580, geolocation_captured_at: fmt(subDays(now, 10)), created_at: fmt(subDays(now, 80)), updated_at: fmt(subDays(now, 1)) },
  { id: 5, name: "Kofi Chill Zone", phone: "+233241000005", type: "CHILLER", location: "Tema, Accra", status: "suspended", last_activity: fmtTime(subDays(now, 14)), latitude: 5.6698, longitude: -0.0166, geolocation_captured_at: fmt(subDays(now, 60)), created_at: fmt(subDays(now, 150)), updated_at: fmt(subDays(now, 14)) },
  { id: 6, name: "Abena Ice Point", phone: "+233241000006", type: "ICE_WATER_SELLER", location: "Dansoman, Accra", status: "active", last_activity: fmtTime(subHours(now, 3)), latitude: 5.5480, longitude: -0.2610, geolocation_captured_at: fmt(subDays(now, 20)), created_at: fmt(subDays(now, 70)), updated_at: fmt(subDays(now, 2)) },
  { id: 7, name: "Yaw Fresh Beverages", phone: "+233241000007", type: "CHILLER", location: "Kumasi", status: "active", last_activity: fmtTime(subHours(now, 12)), latitude: null, longitude: null, geolocation_captured_at: null, created_at: fmt(subDays(now, 60)), updated_at: fmt(subDays(now, 5)) },
  { id: 8, name: "Nana Cooler Station", phone: "+233241000008", type: "CHILLER", location: "Airport Residential, Accra", status: "active", last_activity: fmtTime(subHours(now, 1)), latitude: 5.6050, longitude: -0.1810, geolocation_captured_at: fmt(subDays(now, 5)), created_at: fmt(subDays(now, 45)), updated_at: fmt(subHours(now, 1)) },
  { id: 9, name: "Ama Sachet Water", phone: "+233241000009", type: "ICE_WATER_SELLER", location: "Takoradi", status: "active", last_activity: fmtTime(subDays(now, 2)), latitude: null, longitude: null, geolocation_captured_at: null, created_at: fmt(subDays(now, 40)), updated_at: fmt(subDays(now, 2)) },
  { id: 10, name: "Kojo Refresh Corner", phone: "+233241000010", type: "CHILLER", location: "Achimota, Accra", status: "active", last_activity: fmtTime(subHours(now, 6)), latitude: 5.6310, longitude: -0.2280, geolocation_captured_at: fmt(subDays(now, 8)), created_at: fmt(subDays(now, 35)), updated_at: fmt(subDays(now, 1)) },
  { id: 11, name: "Adjoa Cool Spot", phone: "+233241000011", type: "ICE_WATER_SELLER", location: "Kasoa", status: "suspended", last_activity: fmtTime(subDays(now, 21)), latitude: null, longitude: null, geolocation_captured_at: null, created_at: fmt(subDays(now, 90)), updated_at: fmt(subDays(now, 21)) },
  { id: 12, name: "Kwesi Drinks Depot", phone: "+233241000012", type: "CHILLER", location: "Spintex, Accra", status: "active", last_activity: fmtTime(subHours(now, 4)), latitude: 5.6340, longitude: -0.1020, geolocation_captured_at: fmt(subDays(now, 3)), created_at: fmt(subDays(now, 20)), updated_at: fmt(subHours(now, 4)) },
];

// --- Campaigns (6) ---
export const demoCampaigns: Campaign[] = [
  { id: 1, name: "Q1 Volume Push", type: "VOLUME_REBATE", status: "active", start_date: fmt(subDays(now, 45)), end_date: fmt(addDays(now, 45)), tiers: [{ threshold: 50, reward_amount: 500 }, { threshold: 100, reward_amount: 1200 }, { threshold: 200, reward_amount: 3000 }], total_redemptions: 234, total_spend: 156000, team_id: 1, team_name: "Accra Metro", created_at: fmt(subDays(now, 50)) },
  { id: 2, name: "Mystery Shopper Feb", type: "MYSTERY_SHOPPER", status: "active", start_date: fmt(subDays(now, 20)), end_date: fmt(addDays(now, 10)), reward_amount: 2000, total_redemptions: 18, total_spend: 36000, team_id: 2, team_name: "Tema/East Accra", created_at: fmt(subDays(now, 25)) },
  { id: 3, name: "Ramadan Special Rebate", type: "VOLUME_REBATE", status: "ended", start_date: fmt(subDays(now, 90)), end_date: fmt(subDays(now, 30)), tiers: [{ threshold: 30, reward_amount: 300 }, { threshold: 80, reward_amount: 900 }], total_redemptions: 412, total_spend: 287000, team_id: 1, team_name: "Accra Metro", created_at: fmt(subDays(now, 95)) },
  { id: 4, name: "Easter Cool Down", type: "VOLUME_REBATE", status: "paused", start_date: fmt(subDays(now, 10)), end_date: fmt(addDays(now, 30)), tiers: [{ threshold: 40, reward_amount: 400 }], total_redemptions: 45, total_spend: 18000, team_id: 3, team_name: "Kumasi Region", created_at: fmt(subDays(now, 15)) },
  { id: 5, name: "New Partner Welcome", type: "MYSTERY_SHOPPER", status: "draft", start_date: fmt(addDays(now, 5)), end_date: fmt(addDays(now, 35)), reward_amount: 1500, total_redemptions: 0, total_spend: 0, team_id: 2, team_name: "Tema/East Accra", created_at: fmt(subDays(now, 3)) },
  { id: 6, name: "Summer Blitz 2025", type: "VOLUME_REBATE", status: "draft", start_date: fmt(addDays(now, 15)), end_date: fmt(addDays(now, 75)), tiers: [{ threshold: 60, reward_amount: 600 }, { threshold: 150, reward_amount: 2000 }], total_redemptions: 0, total_spend: 0, team_id: 1, team_name: "Accra Metro", created_at: fmt(subDays(now, 1)) },
];

// --- Promo Codes (15) ---
export const demoCodes: PromoCode[] = [
  { id: 1, code: "MPROMO-Q1-A001", campaign_id: 1, campaign_name: "Q1 Volume Push", issued_to: "Kwame Asante Chiller Hub", status: "redeemed", expires_at: fmt(addDays(now, 45)), redeemed_at: fmtTime(subDays(now, 3)) },
  { id: 2, code: "MPROMO-Q1-A002", campaign_id: 1, campaign_name: "Q1 Volume Push", issued_to: "Akosua Cold Drinks", status: "active", expires_at: fmt(addDays(now, 45)), redeemed_at: null },
  { id: 3, code: "MPROMO-Q1-A003", campaign_id: 1, campaign_name: "Q1 Volume Push", issued_to: null, status: "active", expires_at: fmt(addDays(now, 45)), redeemed_at: null },
  { id: 4, code: "MPROMO-MS-B001", campaign_id: 2, campaign_name: "Mystery Shopper Feb", issued_to: "Abena Ice Point", status: "redeemed", expires_at: fmt(addDays(now, 10)), redeemed_at: fmtTime(subDays(now, 1)) },
  { id: 5, code: "MPROMO-MS-B002", campaign_id: 2, campaign_name: "Mystery Shopper Feb", issued_to: "Amina Ice Water Express", status: "active", expires_at: fmt(addDays(now, 10)), redeemed_at: null },
  { id: 6, code: "MPROMO-MS-B003", campaign_id: 2, campaign_name: "Mystery Shopper Feb", issued_to: null, status: "active", expires_at: fmt(addDays(now, 10)), redeemed_at: null },
  { id: 7, code: "MPROMO-RM-C001", campaign_id: 3, campaign_name: "Ramadan Special Rebate", issued_to: "Efua Pure Water", status: "redeemed", expires_at: fmt(subDays(now, 30)), redeemed_at: fmtTime(subDays(now, 35)) },
  { id: 8, code: "MPROMO-RM-C002", campaign_id: 3, campaign_name: "Ramadan Special Rebate", issued_to: "Kojo Refresh Corner", status: "expired", expires_at: fmt(subDays(now, 30)), redeemed_at: null },
  { id: 9, code: "MPROMO-RM-C003", campaign_id: 3, campaign_name: "Ramadan Special Rebate", issued_to: null, status: "expired", expires_at: fmt(subDays(now, 30)), redeemed_at: null },
  { id: 10, code: "MPROMO-EC-D001", campaign_id: 4, campaign_name: "Easter Cool Down", issued_to: "Kofi Chill Zone", status: "active", expires_at: fmt(addDays(now, 30)), redeemed_at: null },
  { id: 11, code: "MPROMO-EC-D002", campaign_id: 4, campaign_name: "Easter Cool Down", issued_to: "Yaw Fresh Beverages", status: "redeemed", expires_at: fmt(addDays(now, 30)), redeemed_at: fmtTime(subDays(now, 2)) },
  { id: 12, code: "MPROMO-Q1-A004", campaign_id: 1, campaign_name: "Q1 Volume Push", issued_to: "Nana Cooler Station", status: "redeemed", expires_at: fmt(addDays(now, 45)), redeemed_at: fmtTime(subHours(now, 18)) },
  { id: 13, code: "MPROMO-Q1-A005", campaign_id: 1, campaign_name: "Q1 Volume Push", issued_to: null, status: "active", expires_at: fmt(addDays(now, 45)), redeemed_at: null },
  { id: 14, code: "MPROMO-MS-B004", campaign_id: 2, campaign_name: "Mystery Shopper Feb", issued_to: "Kwesi Drinks Depot", status: "cancelled", expires_at: fmt(addDays(now, 10)), redeemed_at: null },
  { id: 15, code: "MPROMO-EC-D003", campaign_id: 4, campaign_name: "Easter Cool Down", issued_to: "Ama Sachet Water", status: "active", expires_at: fmt(addDays(now, 30)), redeemed_at: null },
];

// --- Redemptions (10) ---
export const demoRedemptions: Redemption[] = [
  { id: 1, date: fmtTime(subHours(now, 2)), partner_id: 1, partner_name: "Kwame Asante Chiller Hub", partner_type: "CHILLER", campaign_id: 1, campaign_name: "Q1 Volume Push", amount: 1200, payout_status: "paid", reference: "RED-20250301-001" },
  { id: 2, date: fmtTime(subHours(now, 5)), partner_id: 2, partner_name: "Amina Ice Water Express", partner_type: "ICE_WATER_SELLER", campaign_id: 2, campaign_name: "Mystery Shopper Feb", amount: 2000, payout_status: "pending", reference: "RED-20250301-002" },
  { id: 3, date: fmtTime(subDays(now, 1)), partner_id: 3, partner_name: "Akosua Cold Drinks", partner_type: "CHILLER", campaign_id: 1, campaign_name: "Q1 Volume Push", amount: 500, payout_status: "paid", reference: "RED-20250228-003" },
  { id: 4, date: fmtTime(subDays(now, 1)), partner_id: 6, partner_name: "Abena Ice Point", partner_type: "ICE_WATER_SELLER", campaign_id: 2, campaign_name: "Mystery Shopper Feb", amount: 2000, payout_status: "paid", reference: "RED-20250228-004" },
  { id: 5, date: fmtTime(subDays(now, 2)), partner_id: 8, partner_name: "Nana Cooler Station", partner_type: "CHILLER", campaign_id: 1, campaign_name: "Q1 Volume Push", amount: 3000, payout_status: "pending", reference: "RED-20250227-005" },
  { id: 6, date: fmtTime(subDays(now, 3)), partner_id: 4, partner_name: "Efua Pure Water", partner_type: "ICE_WATER_SELLER", campaign_id: 3, campaign_name: "Ramadan Special Rebate", amount: 900, payout_status: "paid", reference: "RED-20250226-006" },
  { id: 7, date: fmtTime(subDays(now, 3)), partner_id: 10, partner_name: "Kojo Refresh Corner", partner_type: "CHILLER", campaign_id: 1, campaign_name: "Q1 Volume Push", amount: 1200, payout_status: "failed", reference: "RED-20250226-007" },
  { id: 8, date: fmtTime(subDays(now, 5)), partner_id: 12, partner_name: "Kwesi Drinks Depot", partner_type: "CHILLER", campaign_id: 4, campaign_name: "Easter Cool Down", amount: 400, payout_status: "pending", reference: "RED-20250224-008" },
  { id: 9, date: fmtTime(subDays(now, 7)), partner_id: 1, partner_name: "Kwame Asante Chiller Hub", partner_type: "CHILLER", campaign_id: 1, campaign_name: "Q1 Volume Push", amount: 500, payout_status: "paid", reference: "RED-20250222-009" },
  { id: 10, date: fmtTime(subDays(now, 10)), partner_id: 7, partner_name: "Yaw Fresh Beverages", partner_type: "CHILLER", campaign_id: 4, campaign_name: "Easter Cool Down", amount: 400, payout_status: "paid", reference: "RED-20250219-010" },
];

// --- Payouts (8) ---
export const demoPayouts: Payout[] = [
  { id: 1, partner_id: 1, partner_name: "Kwame Asante Chiller Hub", phone: "+233241000001", amount: 1700, status: "paid", paystack_reference: "PSK-TXN-00A1B2", paid_at: fmtTime(subDays(now, 1)), created_at: fmt(subDays(now, 3)) },
  { id: 2, partner_id: 3, partner_name: "Akosua Cold Drinks", phone: "+233241000003", amount: 500, status: "paid", paystack_reference: "PSK-TXN-00C3D4", paid_at: fmtTime(subDays(now, 2)), created_at: fmt(subDays(now, 4)) },
  { id: 3, partner_id: 6, partner_name: "Abena Ice Point", phone: "+233241000006", amount: 2000, status: "paid", paystack_reference: "PSK-TXN-00E5F6", paid_at: fmtTime(subDays(now, 1)), created_at: fmt(subDays(now, 2)) },
  { id: 4, partner_id: 2, partner_name: "Amina Ice Water Express", phone: "+233241000002", amount: 2000, status: "pending", paystack_reference: null, paid_at: null, created_at: fmt(subDays(now, 1)) },
  { id: 5, partner_id: 8, partner_name: "Nana Cooler Station", phone: "+233241000008", amount: 3000, status: "pending", paystack_reference: null, paid_at: null, created_at: fmt(subDays(now, 2)) },
  { id: 6, partner_id: 10, partner_name: "Kojo Refresh Corner", phone: "+233241000010", amount: 1200, status: "failed", paystack_reference: "PSK-TXN-00G7H8", paid_at: null, created_at: fmt(subDays(now, 4)) },
  { id: 7, partner_id: 4, partner_name: "Efua Pure Water", phone: "+233241000004", amount: 900, status: "paid", paystack_reference: "PSK-TXN-00I9J0", paid_at: fmtTime(subDays(now, 3)), created_at: fmt(subDays(now, 5)) },
  { id: 8, partner_id: 12, partner_name: "Kwesi Drinks Depot", phone: "+233241000012", amount: 400, status: "pending", paystack_reference: null, paid_at: null, created_at: fmt(subDays(now, 5)) },
];

// --- Orders (10) ---
export const demoOrders: MPromoOrder[] = [
  { id: 1, order_no: "ORD-MP-0001", partner_id: 1, partner_name: "Kwame Asante Chiller Hub", date: fmt(subHours(now, 1)), total: 45000, status: "delivered", source: "MPROMO", team_id: 1, team_name: "Accra Metro" },
  { id: 2, order_no: "ORD-MP-0002", partner_id: 3, partner_name: "Akosua Cold Drinks", date: fmt(subHours(now, 3)), total: 32000, status: "confirmed", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 3, order_no: "ORD-MP-0003", partner_id: 2, partner_name: "Amina Ice Water Express", date: fmt(subHours(now, 6)), total: 18500, status: "pending", source: "MPROMO", team_id: 1, team_name: "Accra Metro" },
  { id: 4, order_no: "ORD-MP-0004", partner_id: 8, partner_name: "Nana Cooler Station", date: fmt(subDays(now, 1)), total: 67000, status: "delivered", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 5, order_no: "ORD-MP-0005", partner_id: 6, partner_name: "Abena Ice Point", date: fmt(subDays(now, 1)), total: 12000, status: "delivered", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 6, order_no: "ORD-MP-0006", partner_id: 4, partner_name: "Efua Pure Water", date: fmt(subDays(now, 2)), total: 25000, status: "cancelled", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 7, order_no: "ORD-MP-0007", partner_id: 10, partner_name: "Kojo Refresh Corner", date: fmt(subDays(now, 2)), total: 38000, status: "confirmed", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 8, order_no: "ORD-MP-0008", partner_id: 12, partner_name: "Kwesi Drinks Depot", date: fmt(subDays(now, 3)), total: 54000, status: "delivered", source: "MPROMO", team_id: 2, team_name: "Tema/East Accra" },
  { id: 9, order_no: "ORD-MP-0009", partner_id: 7, partner_name: "Yaw Fresh Beverages", date: fmt(subDays(now, 4)), total: 21000, status: "delivered", source: "MPROMO", team_id: 3, team_name: "Kumasi Region" },
  { id: 10, order_no: "ORD-MP-0010", partner_id: 1, partner_name: "Kwame Asante Chiller Hub", date: fmt(subDays(now, 5)), total: 33000, status: "delivered", source: "MPROMO", team_id: 1, team_name: "Accra Metro" },
];

// --- Map Partners (8) ---
export const demoMapPartners: MapPartner[] = [
  { id: 1, name: "Kwame Asante Chiller Hub", type: "CHILLER", status: "active", phone: "+233241000001", location: "Osu, Accra", latitude: 5.5560, longitude: -0.1820, last_activity: fmtTime(subHours(now, 2)), redemptions_count: 12, redemptions_amount: 8400, orders_count: 5, orders_amount: 78000, pending_payouts_count: 0, pending_payouts_amount: 0 },
  { id: 2, name: "Amina Ice Water Express", type: "ICE_WATER_SELLER", status: "active", phone: "+233241000002", location: "Madina, Accra", latitude: 5.6700, longitude: -0.1674, last_activity: fmtTime(subHours(now, 5)), redemptions_count: 6, redemptions_amount: 4200, orders_count: 3, orders_amount: 18500, pending_payouts_count: 1, pending_payouts_amount: 2000 },
  { id: 3, name: "Akosua Cold Drinks", type: "CHILLER", status: "active", phone: "+233241000003", location: "Cantonments, Accra", latitude: 5.5620, longitude: -0.1730, last_activity: fmtTime(subHours(now, 8)), redemptions_count: 8, redemptions_amount: 5600, orders_count: 4, orders_amount: 32000, pending_payouts_count: 0, pending_payouts_amount: 0 },
  { id: 4, name: "Efua Pure Water", type: "ICE_WATER_SELLER", status: "active", phone: "+233241000004", location: "East Legon, Accra", latitude: 5.6380, longitude: -0.1580, last_activity: fmtTime(subDays(now, 1)), redemptions_count: 4, redemptions_amount: 3600, orders_count: 2, orders_amount: 25000, pending_payouts_count: 0, pending_payouts_amount: 0 },
  { id: 6, name: "Abena Ice Point", type: "ICE_WATER_SELLER", status: "active", phone: "+233241000006", location: "Dansoman, Accra", latitude: 5.5480, longitude: -0.2610, last_activity: fmtTime(subHours(now, 3)), redemptions_count: 3, redemptions_amount: 6000, orders_count: 2, orders_amount: 12000, pending_payouts_count: 0, pending_payouts_amount: 0 },
  { id: 8, name: "Nana Cooler Station", type: "CHILLER", status: "active", phone: "+233241000008", location: "Airport Residential, Accra", latitude: 5.6050, longitude: -0.1810, last_activity: fmtTime(subHours(now, 1)), redemptions_count: 15, redemptions_amount: 18000, orders_count: 7, orders_amount: 67000, pending_payouts_count: 1, pending_payouts_amount: 3000 },
  { id: 10, name: "Kojo Refresh Corner", type: "CHILLER", status: "active", phone: "+233241000010", location: "Achimota, Accra", latitude: 5.6310, longitude: -0.2280, last_activity: fmtTime(subHours(now, 6)), redemptions_count: 5, redemptions_amount: 3500, orders_count: 3, orders_amount: 38000, pending_payouts_count: 0, pending_payouts_amount: 0 },
  { id: 12, name: "Kwesi Drinks Depot", type: "CHILLER", status: "active", phone: "+233241000012", location: "Spintex, Accra", latitude: 5.6340, longitude: -0.1020, last_activity: fmtTime(subHours(now, 4)), redemptions_count: 2, redemptions_amount: 800, orders_count: 1, orders_amount: 54000, pending_payouts_count: 1, pending_payouts_amount: 400 },
];

// --- Overview KPIs ---
export const demoOverview: MPromoOverview = {
  active_campaigns: 2,
  today_redemptions_count: 5,
  today_redemptions_amount: 6900,
  pending_payouts_count: 3,
  pending_payouts_amount: 5400,
  orders_today: 3,
  top_chillers: [
    { id: 8, name: "Nana Cooler Station", value: 18000 },
    { id: 1, name: "Kwame Asante Chiller Hub", value: 8400 },
    { id: 3, name: "Akosua Cold Drinks", value: 5600 },
    { id: 10, name: "Kojo Refresh Corner", value: 3500 },
    { id: 12, name: "Kwesi Drinks Depot", value: 800 },
  ],
  top_ice_water_sellers: [
    { id: 6, name: "Abena Ice Point", value: 6000 },
    { id: 2, name: "Amina Ice Water Express", value: 4200 },
    { id: 4, name: "Efua Pure Water", value: 3600 },
  ],
  recent_activity: [
    { id: 1, type: "redemption", description: "Kwame Asante Chiller Hub redeemed GH₵1,200 from Q1 Volume Push", time: fmtTime(subHours(now, 2)) },
    { id: 2, type: "order", description: "New order ORD-MP-0001 from Kwame Asante Chiller Hub — GH₵45,000", time: fmtTime(subHours(now, 1)) },
    { id: 3, type: "redemption", description: "Amina Ice Water Express redeemed GH₵2,000 from Mystery Shopper Feb", time: fmtTime(subHours(now, 5)) },
    { id: 4, type: "order", description: "New order ORD-MP-0002 from Akosua Cold Drinks — GH₵32,000", time: fmtTime(subHours(now, 3)) },
    { id: 5, type: "redemption", description: "Nana Cooler Station redeemed GH₵3,000 from Q1 Volume Push", time: fmtTime(subDays(now, 2)) },
  ],
};
