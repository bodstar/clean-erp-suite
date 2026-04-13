import type {
  Product,
  ProductCategory,
  UnregisteredCustomer,
  SDOrder,
  SDOrderSummary,
  SDDriver,
  SDRoute,
  SDRouteSummary,
} from "@/types/sd";

export const demoCategories: ProductCategory[] = [
  { id: 1, name: "Sachet Water", slug: "sachet-water", description: "Packaged in bags of 30" },
  { id: 2, name: "PET Bottles", slug: "pet-bottles", description: "Sealed plastic bottles" },
  { id: 3, name: "Jar Water", slug: "jar-water", description: "Large refillable jars" },
];

export const demoProducts: Product[] = [
  {
    id: 1, sku: "MW-500S", name: "500ml Sachet Water",
    category_id: 1, category_name: "Sachet Water",
    unit_of_measure: "bag", base_unit_price: 5.00, franchisee_unit_price: 5.50,
    is_active: true, is_franchisee_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2, sku: "MW-500P", name: "500ml PET Bottle",
    category_id: 2, category_name: "PET Bottles",
    unit_of_measure: "pack", base_unit_price: 18.00, franchisee_unit_price: 19.50,
    is_active: true, is_franchisee_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 3, sku: "MW-1LP", name: "1L PET Bottle",
    category_id: 2, category_name: "PET Bottles",
    unit_of_measure: "pack", base_unit_price: 32.00, franchisee_unit_price: 34.00,
    is_active: true, is_franchisee_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 4, sku: "MW-20J", name: "20L Jar",
    category_id: 3, category_name: "Jar Water",
    unit_of_measure: "bottle", base_unit_price: 45.00, franchisee_unit_price: 48.00,
    is_active: true, is_franchisee_active: false,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
];

export const demoUnregisteredCustomers: UnregisteredCustomer[] = [
  {
    id: 1, name: "Kofi Asante", phone: "0277123456",
    address: "Okaishie Market, Accra", team_id: 2, team_name: "Franchise – Accra Central",
    notes: "Regular buyer — to be onboarded next quarter",
    created_at: "2026-03-10T09:00:00Z",
  },
  {
    id: 2, name: "Abena Mensah", phone: "0244987654",
    address: "Kejetia Market, Kumasi", team_id: 3, team_name: "Franchise – Kumasi",
    created_at: "2026-03-15T11:30:00Z",
  },
  {
    id: 3, name: "Yaa Serwaa", phone: "0501234567",
    address: "Tamale Central Market, Tamale", team_id: 2, team_name: "Franchise – Accra Central",
    created_at: "2026-03-20T14:00:00Z",
  },
];

export const demoOrders: SDOrderSummary[] = [
  {
    id: 1, order_no: "SD-2026-00001", source: "web", status: "delivered",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 1, partner_name: "Kwame Asante Cold Store", partner_phone: "0244123456",
    delivery_address: "Kaneshie Market, Accra",
    delivery_lat: 5.5720, delivery_lng: -0.2280,
    subtotal: 275.00, total: 275.00, item_count: 2,
    created_by_name: "Dispatcher Accra", scheduled_at: "2026-04-01T08:00:00Z",
    delivered_at: "2026-04-01T10:30:00Z",
    created_at: "2026-03-31T16:00:00Z", updated_at: "2026-04-01T10:30:00Z",
  },
  {
    id: 2, order_no: "SD-2026-00002", source: "ussd", status: "in_transit",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 3, partner_name: "Afia Ice Water", partner_phone: "0201456789",
    delivery_address: "Tema Station, Accra",
    delivery_lat: 5.6145, delivery_lng: -0.1743,
    subtotal: 110.00, total: 110.00, item_count: 1,
    created_by_name: "USSD System", scheduled_at: "2026-04-10T09:00:00Z",
    created_at: "2026-04-09T20:15:00Z", updated_at: "2026-04-10T09:45:00Z",
  },
  {
    id: 3, order_no: "SD-2026-00003", source: "web", status: "confirmed",
    team_id: 3, team_name: "Franchise – Kumasi",
    unregistered_customer_id: 2, unregistered_customer_name: "Abena Mensah",
    unregistered_customer_phone: "0244987654",
    delivery_address: "Kejetia Market, Kumasi",
    delivery_lat: 6.6885, delivery_lng: -1.6244,
    subtotal: 192.00, total: 192.00, item_count: 2,
    created_by_name: "Dispatcher Kumasi", scheduled_at: "2026-04-11T10:00:00Z",
    created_at: "2026-04-10T14:00:00Z", updated_at: "2026-04-10T14:05:00Z",
  },
  {
    id: 4, order_no: "SD-2026-00004", source: "mpromo", status: "assigned",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 5, partner_name: "Yaw Boateng Chillers", partner_phone: "0268345678",
    delivery_address: "Lapaz, Accra",
    subtotal: 550.00, total: 550.00, item_count: 3,
    driver_id: 1, driver_name: "Emmanuel Tetteh",
    created_by_name: "M-Promo System", scheduled_at: "2026-04-12T07:00:00Z",
    created_at: "2026-04-10T10:00:00Z", updated_at: "2026-04-10T11:00:00Z",
  },
  {
    id: 5, order_no: "SD-2026-00005", source: "web", status: "draft",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 7, partner_name: "Adwoa Water Point", partner_phone: "0559234567",
    delivery_address: "Madina Market, Accra",
    subtotal: 82.50, total: 82.50, item_count: 1,
    created_by_name: "Dispatcher Accra",
    created_at: "2026-04-10T15:30:00Z", updated_at: "2026-04-10T15:30:00Z",
  },
  {
    id: 6, order_no: "SD-2026-00006", source: "mobile", status: "cancelled",
    team_id: 3, team_name: "Franchise – Kumasi",
    partner_id: 12, partner_name: "Kojo Refrigeration", partner_phone: "0244567890",
    delivery_address: "Bantama, Kumasi",
    subtotal: 160.00, total: 160.00, item_count: 2,
    created_by_name: "Kojo Refrigeration",
    created_at: "2026-04-08T12:00:00Z", updated_at: "2026-04-08T13:00:00Z",
  },
  {
    id: 7, order_no: "SD-2026-00007", source: "web", status: "delivered",
    team_id: 3, team_name: "Franchise – Kumasi",
    partner_id: 10, partner_name: "Ama Sei Minerals", partner_phone: "0277654321",
    delivery_address: "Adum, Kumasi",
    subtotal: 340.00, total: 340.00, item_count: 2,
    created_by_name: "Dispatcher Kumasi", scheduled_at: "2026-04-09T07:00:00Z",
    delivered_at: "2026-04-09T09:15:00Z",
    created_at: "2026-04-08T17:00:00Z", updated_at: "2026-04-09T09:15:00Z",
  },
  {
    id: 8, order_no: "SD-2026-00008", source: "ussd", status: "confirmed",
    team_id: 2, team_name: "Franchise – Accra Central",
    unregistered_customer_id: 1, unregistered_customer_name: "Kofi Asante",
    unregistered_customer_phone: "0277123456",
    delivery_address: "Okaishie Market, Accra",
    subtotal: 95.00, total: 95.00, item_count: 1,
    created_by_name: "USSD System", scheduled_at: "2026-04-12T08:00:00Z",
    created_at: "2026-04-11T22:00:00Z", updated_at: "2026-04-11T22:05:00Z",
  },
  {
    id: 9, order_no: "SD-2026-00009", source: "web", status: "in_transit",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 2, partner_name: "Esi Dadzie Enterprise", partner_phone: "0200987654",
    delivery_address: "Circle, Accra",
    subtotal: 420.00, total: 420.00, item_count: 3,
    driver_id: 2, driver_name: "Isaac Owusu",
    created_by_name: "Dispatcher Accra", scheduled_at: "2026-04-12T06:30:00Z",
    created_at: "2026-04-11T18:00:00Z", updated_at: "2026-04-12T06:45:00Z",
  },
  {
    id: 10, order_no: "SD-2026-00010", source: "mobile", status: "delivered",
    team_id: 2, team_name: "Franchise – Accra Central",
    partner_id: 8, partner_name: "Nana Ama Store", partner_phone: "0244111222",
    delivery_address: "East Legon, Accra",
    subtotal: 165.00, total: 165.00, item_count: 2,
    created_by_name: "Nana Ama Store", scheduled_at: "2026-04-11T14:00:00Z",
    delivered_at: "2026-04-11T15:20:00Z",
    created_at: "2026-04-11T10:00:00Z", updated_at: "2026-04-11T15:20:00Z",
  },
  {
    id: 11, order_no: "SD-2026-00011", source: "web", status: "failed",
    team_id: 3, team_name: "Franchise – Kumasi",
    partner_id: 15, partner_name: "Kwaku Mensah Trading", partner_phone: "0509876543",
    delivery_address: "Suame Magazine, Kumasi",
    subtotal: 230.00, total: 230.00, item_count: 2,
    notes: "Customer not available at delivery location",
    created_by_name: "Dispatcher Kumasi", scheduled_at: "2026-04-10T08:00:00Z",
    created_at: "2026-04-09T20:00:00Z", updated_at: "2026-04-10T10:00:00Z",
  },
  {
    id: 12, order_no: "SD-2026-00012", source: "web", status: "draft",
    team_id: 3, team_name: "Franchise – Kumasi",
    unregistered_customer_id: 3, unregistered_customer_name: "Yaa Serwaa",
    unregistered_customer_phone: "0501234567",
    delivery_address: "Asafo Market, Kumasi",
    subtotal: 55.00, total: 55.00, item_count: 1,
    created_by_name: "Dispatcher Kumasi",
    created_at: "2026-04-12T08:00:00Z", updated_at: "2026-04-12T08:00:00Z",
  },
];

export const demoOrderDetails: Record<number, SDOrder> = {
  1: {
    ...demoOrders[0],
    items: [
      {
        id: 1, product_id: 1, product_name: "500ml Sachet Water", product_sku: "MW-500S",
        unit_of_measure: "bag", quantity: 30, computed_unit_price: 5.50, unit_price: 5.50,
        line_total: 165.00,
      },
      {
        id: 2, product_id: 2, product_name: "500ml PET Bottle", product_sku: "MW-500P",
        unit_of_measure: "pack", quantity: 5, computed_unit_price: 19.50, unit_price: 22.00,
        line_total: 110.00, price_override_note: "Loyalty discount applied manually",
      },
    ],
  },
  4: {
    ...demoOrders[3],
    items: [
      {
        id: 3, product_id: 1, product_name: "500ml Sachet Water", product_sku: "MW-500S",
        unit_of_measure: "bag", quantity: 50, computed_unit_price: 5.225, unit_price: 5.225,
        line_total: 261.25,
      },
      {
        id: 4, product_id: 2, product_name: "500ml PET Bottle", product_sku: "MW-500P",
        unit_of_measure: "pack", quantity: 10, computed_unit_price: 19.50, unit_price: 19.50,
        line_total: 195.00,
      },
      {
        id: 5, product_id: 3, product_name: "1L PET Bottle", product_sku: "MW-1LP",
        unit_of_measure: "pack", quantity: 2, computed_unit_price: 34.00, unit_price: 34.00,
        line_total: 68.00,
      },
    ],
  },
};

// ─── Drivers ─────────────────────────────────────────────────────────────────

export const demoDrivers: SDDriver[] = [
  {
    id: 1, user_id: 10, name: 'Emmanuel Tetteh', phone: '0244123456',
    license_no: 'GH-DL-2021-004521', vehicle_type: 'Pickup Truck',
    vehicle_plate: 'GR-1234-21', status: 'on_delivery', is_available: true,
    current_lat: 5.6037, current_lng: -0.1870,
    last_location_at: new Date().toISOString(),
    active_route_id: 1, team_id: 2, team_name: 'Franchise – Accra Central',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 2, user_id: 11, name: 'Isaac Owusu', phone: '0201987654',
    license_no: 'GH-DL-2020-003311', vehicle_type: 'Motorbike',
    vehicle_plate: 'M-4521-22', status: 'available', is_available: true,
    current_lat: 5.5913, current_lng: -0.2068,
    last_location_at: new Date().toISOString(),
    team_id: 2, team_name: 'Franchise – Accra Central',
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 3, user_id: 12, name: 'Abena Kyei', phone: '0559876543',
    license_no: 'GH-DL-2022-007812', vehicle_type: 'Van',
    vehicle_plate: 'AS-3310-20', status: 'off_duty', is_available: false,
    team_id: 3, team_name: 'Franchise – Kumasi',
    created_at: '2026-03-01T00:00:00Z',
  },
];

// ─── Routes ──────────────────────────────────────────────────────────────────

export const demoRoutes: SDRouteSummary[] = [
  {
    id: 1, driver_id: 1, driver_name: 'Emmanuel Tetteh',
    driver_vehicle: 'Pickup Truck · GR-1234-21',
    team_id: 2, team_name: 'Franchise – Accra Central',
    status: 'active', date: '2026-04-12', optimised_by: 'system',
    stop_count: 3, completed_stops: 1, created_at: '2026-04-11T18:00:00Z',
  },
  {
    id: 2, driver_id: 2, driver_name: 'Isaac Owusu',
    driver_vehicle: 'Motorbike · M-4521-22',
    team_id: 2, team_name: 'Franchise – Accra Central',
    status: 'draft', date: '2026-04-13', optimised_by: 'manual',
    stop_count: 2, completed_stops: 0, created_at: '2026-04-11T20:00:00Z',
  },
];

export const demoRouteDetails: Record<number, SDRoute> = {
  1: {
    ...demoRoutes[0],
    stops: [
      {
        id: 1, route_id: 1, order_id: 1, order_no: 'SD-2026-00001', sequence: 1,
        status: 'completed', customer_name: 'Kwame Asante Cold Store',
        delivery_address: 'Kaneshie Market, Accra',
        delivery_lat: 5.5502, delivery_lng: -0.2174,
        completed_at: '2026-04-12T10:30:00Z',
      },
      {
        id: 2, route_id: 1, order_id: 2, order_no: 'SD-2026-00002', sequence: 2,
        status: 'arrived', customer_name: 'Afia Ice Water',
        delivery_address: 'Tema Station, Accra',
        delivery_lat: 5.6168, delivery_lng: -0.0165,
      },
      {
        id: 3, route_id: 1, order_id: 4, order_no: 'SD-2026-00004', sequence: 3,
        status: 'pending', customer_name: 'Yaw Boateng Chillers',
        delivery_address: 'Lapaz, Accra',
        delivery_lat: 5.6270, delivery_lng: -0.2341,
      },
    ],
  },
};
