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

// ─── Drivers ─────────────────────────────────────────────────────────────────

export type DriverStatus = 'available' | 'on_delivery' | 'off_duty';

export interface SDDriver {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  license_no: string;
  vehicle_type: string;
  vehicle_plate: string;
  status: DriverStatus;
  is_available: boolean;
  current_lat?: number;
  current_lng?: number;
  last_location_at?: string;
  active_route_id?: number;
  team_id: number;
  team_name?: string;
  created_at: string;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export type RouteStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type RouteStopStatus = 'pending' | 'arrived' | 'completed' | 'skipped';
export type RouteOptimisedBy = 'manual' | 'system';

export interface SDRouteStop {
  id: number;
  route_id: number;
  order_id: number;
  order_no: string;
  sequence: number;
  status: RouteStopStatus;
  customer_name: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  arrived_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface SDRoute {
  id: number;
  driver_id: number;
  driver_name: string;
  driver_vehicle: string;
  team_id: number;
  team_name?: string;
  status: RouteStatus;
  date: string;
  optimised_by: RouteOptimisedBy;
  stop_count: number;
  completed_stops: number;
  stops: SDRouteStop[];
  created_at: string;
}

export interface SDRouteSummary extends Omit<SDRoute, 'stops'> {}

// ─── Dispatch Map ────────────────────────────────────────────────────────────

export interface DriverLocation {
  driver_id: number;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface DispatchMapDriver {
  driver_id: number;
  driver_name: string;
  vehicle_type: string;
  vehicle_plate: string;
  status: DriverStatus;
  current_lat: number;
  current_lng: number;
  last_location_at: string;
  active_route_id?: number;
  current_order_id?: number;
  current_order_no?: string;
  current_destination?: string;
  current_destination_lat?: number;
  current_destination_lng?: number;
  team_id: number;
  team_name?: string;
}
