import type { ScopeMode } from "@/types/mpromo";

/** Describes which team's data should be shown in the S&D module */
export interface SDScope {
  mode: ScopeMode;
  targetTeamId?: number | null;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  category_name: string;
  unit_of_measure: string;
  base_unit_price: number;
  franchisee_unit_price?: number;
  is_active: boolean;
  is_franchisee_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceTier {
  id: number;
  product_id: number;
  team_id?: number;
  min_quantity: number;
  max_quantity?: number;
  unit_price: number;
  valid_from?: string;
  valid_until?: string;
}

// ─── Unregistered Customers ──────────────────────────────────────────────────

export interface UnregisteredCustomer {
  id: number;
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  converted_partner_id?: number;
  team_id: number;
  team_name?: string;
  created_at: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type SDOrderStatus =
  | "draft"
  | "confirmed"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export type SDOrderSource = "web" | "ussd" | "mobile" | "mpromo";

export interface SDOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_of_measure: string;
  quantity: number;
  computed_unit_price: number;
  unit_price: number;
  line_total: number;
  price_override_note?: string;
}

export interface SDOrder {
  id: number;
  order_no: string;
  source: SDOrderSource;
  status: SDOrderStatus;
  team_id: number;
  team_name?: string;

  partner_id?: number;
  partner_name?: string;
  partner_phone?: string;
  unregistered_customer_id?: number;
  unregistered_customer_name?: string;
  unregistered_customer_phone?: string;

  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  scheduled_at?: string;
  delivered_at?: string;
  notes?: string;

  driver_id?: number;
  driver_name?: string;

  subtotal: number;
  total: number;

  items: SDOrderItem[];

  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface SDOrderSummary extends Omit<SDOrder, "items"> {
  item_count: number;
}
