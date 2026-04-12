

## Plan: Build Sales & Distribution (S&D) Module — Phase 1

This creates a complete new top-level module with types, demo data, API stubs, layout, routing, permissions, and 10 page components.

### Files to Create (13 new files)

**1. `src/types/sd.ts`** — All TypeScript interfaces and types as specified (Product, ProductCategory, UnregisteredCustomer, SDOrder, SDOrderSummary, SDOrderItem, enums)

**2. `src/lib/api/sd-demo.ts`** — Demo data: categories, products, unregistered customers, 6 order summaries, order detail records (all Ghana-context)

**3. `src/lib/api/sd.ts`** — API layer with DEMO_MODE support: getProducts, computeItemPrice, getUnregisteredCustomers, createUnregisteredCustomer, getOrders, getOrder, createOrder, updateOrderStatus

**4. `src/components/sd/SDLayout.tsx`** — Layout wrapper mirroring MPromoLayout pattern with tab navigation (Overview, Orders, Products, Customers, Drivers, Routes, Map), permission gating, mobile dropdown, Outlet

**5. `src/pages/sd/SDOverview.tsx`** — KPI cards (Total Orders Today, In Transit, Pending Confirmation, Delivered Today), recent orders table, status breakdown using recharts bar chart

**6. `src/pages/sd/SDOrders.tsx`** — DataTable list with search, status filter, source filter, New Order button, row click navigation

**7. `src/pages/sd/SDOrderDetail.tsx`** — Order header, customer section (with partner link if registered), delivery info, items table with price override warnings, status action buttons based on current status

**8. `src/pages/sd/SDOrderCreate.tsx`** — Multi-step form: Step 1 (customer selection — registered partner via getPartners or unregistered), Step 2 (product items with computed pricing, schedule, notes), Step 3 (review & submit)

**9. `src/pages/sd/SDProducts.tsx`** — Product catalogue DataTable with search, category filter, price columns in GH₵

**10. `src/pages/sd/SDCustomers.tsx`** — Unregistered customers DataTable with search, Add Customer form, "Register as Partner" link

**11. `src/pages/sd/SDDrivers.tsx`** — Coming Soon placeholder (Phase 2)

**12. `src/pages/sd/SDRoutes.tsx`** — Coming Soon placeholder (Phase 2)

**13. `src/pages/sd/SDMap.tsx`** — Coming Soon placeholder (Phase 3)

### Files to Modify (4 existing files)

**14. `src/config/navigation.ts`** — Add S&D nav item: `{ label: "Sales & Distribution", path: "/sd", icon: Truck, permission: "sd.view" }` (Truck icon already imported)

**15. `src/App.tsx`** — Add `/sd` route group with SDLayout wrapper and all child routes (mirroring the mpromo pattern)

**16. `src/providers/AuthProvider.tsx`** — Add sd.* permission slugs to all three demo teams (HQ gets full set, franchisees get view + orders.create + customers.manage)

**17. `src/components/shared/StatusBadge.tsx`** — Add missing status styles: `assigned` (purple), `in_transit` (amber/orange). Add a new `SourceBadge` component for order source display (web=blue, ussd=purple, mobile=green, mpromo=amber) — or create it as a separate small component in the sd folder.

### Technical Details

- **DEMO_MODE detection**: Uses `!import.meta.env.VITE_API_BASE_URL` (same as AuthProvider) rather than `VITE_DEMO_MODE` string check — will align with existing pattern
- **SDLayout** won't include ScopeSelector since S&D doesn't have its own scope provider yet — orders are team-scoped by auth context
- **Order creation Step 1** calls `getPartners()` from `@/lib/api/mpromo` for registered partner search — this is a cross-module read, not a modification
- **Source badges** will be a simple inline component or a `SourceBadge` in `src/components/sd/SourceBadge.tsx`
- **Price override warning** in order detail uses a yellow `AlertTriangle` icon with tooltip showing the override note
- **Status action buttons** use ConfirmDialog pattern already established in MPromo

