

# M-Promo Module -- Refined Implementation Plan

## Summary
Add a complete "M-Promo" module to the CLEAN ERP frontend with four key refinements over the previous plan: HQ Global Mode for multi-team control, map performance future-proofing with viewport-based loading, orders integration aligned with the Sales module, and a geo-registration queue for capturing missing partner locations.

---

## 1. Navigation and Permissions

**Update `src/config/navigation.ts`**
- Add nav item: `{ label: "M-Promo", path: "/mpromo", icon: Gift, permission: "mpromo.view" }`

**Update `src/providers/AuthProvider.tsx`**
- Magvlyn HQ demo team gets all permissions: `mpromo.view`, `mpromo.partners.manage`, `mpromo.campaign.manage`, `mpromo.codes.manage`, `mpromo.redemptions.view`, `mpromo.payouts.manage`, `mpromo.orders.view`, `mpromo.hq.global_view`, `mpromo.hq.run_campaigns_any_team`
- Franchise Lagos demo team gets limited subset: `mpromo.view`, `mpromo.redemptions.view`, `mpromo.orders.view` (no HQ permissions)

---

## 2. Routing

**Update `src/App.tsx`**
- Add nested routes under the authenticated layout:
  - `/mpromo` redirects to `/mpromo/overview`
  - `/mpromo/overview`, `/mpromo/partners`, `/mpromo/partners/:id`
  - `/mpromo/campaigns`, `/mpromo/campaigns/new`, `/mpromo/campaigns/:id`
  - `/mpromo/codes`, `/mpromo/redemptions`, `/mpromo/payouts`, `/mpromo/orders`
  - `/mpromo/map`
  - `/mpromo/geo-queue` (new: geo-registration queue)

**Update `src/components/layout/Breadcrumbs.tsx`**
- Add label mappings for `/mpromo` sub-paths (e.g., "M-Promo > Partners > Detail", "M-Promo > Geo Queue")

---

## 3. HQ Global Mode (NEW)

**Create `src/components/mpromo/ScopeSelector.tsx`**
- A control bar rendered at the top of `MPromoLayout`, visible only if user has `mpromo.hq.global_view` or `mpromo.hq.run_campaigns_any_team`
- Three modes:
  - **Current Team** (default) -- behaves normally using `X-Team-ID`
  - **All Teams** -- read-only aggregated view; tables and KPIs show data across all teams; action buttons are disabled
  - **Act on Team: [dropdown]** -- selects a `target_team_id` for write actions (create campaign, generate codes, etc.)
- The selected scope is stored in a React context (`MPromoScopeProvider`) so all child pages can access `{ mode, targetTeamId }`

**Create `src/providers/MPromoScopeProvider.tsx`**
- Context providing: `scopeMode` ("current" | "all" | "target"), `targetTeamId` (number | null), `setScopeMode`, `setTargetTeamId`
- All API calls in the mpromo module read from this context
- When `mode === "all"`, API stubs pass `?scope=all`
- When `mode === "target"`, API stubs pass `?target_team_id=<id>`
- The `X-Team-ID` header remains unchanged (always the user's auth team)

**Permission enforcement**
- Franchise users (no HQ permissions) never see the ScopeSelector
- "Act on Team" mode requires `mpromo.hq.run_campaigns_any_team`; "All Teams" requires `mpromo.hq.global_view`
- Action buttons (Create Campaign, Generate Codes, Pay Now) are disabled in "All Teams" mode

---

## 4. M-Promo Sub-Layout

**Create `src/components/mpromo/MPromoLayout.tsx`**
- Wraps all `/mpromo/*` routes
- Renders `ScopeSelector` at the top (if permitted), then a horizontal tab/pill navigation bar for sub-sections
- Tabs shown/hidden based on permissions: Overview, Partners, Campaigns, Codes, Redemptions, Payouts, Orders, Map, Geo Queue
- Renders child routes via `<Outlet />`

---

## 5. Shared / Reusable Components

**Create `src/components/shared/DataTable.tsx`**
- Search input, filter dropdowns, pagination (prev/next + page info)
- Loading skeleton, empty state, error state
- Accepts column config and data array as props

**Create `src/components/shared/KpiCard.tsx`**
- Stat card: icon, label, value, optional subtitle
- Loading skeleton variant

**Create `src/components/shared/StatusBadge.tsx`**
- Colored badge for statuses: active, paused, pending, failed, paid, expired, suspended, etc.

---

## 6. Type Definitions

**Create `src/types/mpromo.ts`**
- `Partner` -- includes optional `latitude`, `longitude`, `geolocation_captured_at` fields
- `Campaign`, `CampaignTier`, `PromoCode`, `Redemption`, `Payout`
- `MPromoOrder` -- mirrors Sales Order shape with a `source: "MPROMO"` field
- `MPromoOverview` -- KPI data structure
- `MapPartner` -- includes lat/lng, type, status, metrics summary
- `MPromoScope` -- `{ mode: "current" | "all" | "target"; targetTeamId?: number }`

---

## 7. API Stubs

**Create `src/lib/api/mpromo.ts`**

All functions use the existing `api` client (auth headers auto-attached). Each accepts an optional `scope` parameter from the MPromoScopeProvider:

- **Overview**: `getOverview(scope?)`
- **Partners**: `getPartners(params, scope?)`, `getPartner(id)`, `createPartner(data, scope?)`, `updatePartner(id, data)`, `suspendPartner(id)`, `activatePartner(id)`, `updatePartnerGeolocation(id, { latitude, longitude })`
- **Campaigns**: `getCampaigns(params, scope?)`, `createCampaign(data, scope?)`, `getCampaign(id)`, `activateCampaign(id)`, `pauseCampaign(id)`, `endCampaign(id)`
- **Codes**: `getCodes(params, scope?)`, `generateCodes(data, scope?)`
- **Redemptions**: `getRedemptions(params, scope?)`
- **Payouts**: `getPayouts(params, scope?)`, `payPayout(id, scope?)`
- **Orders**: `getOrders(params, scope?)` -- calls `GET /api/sales/orders?source=MPROMO` (aligned with Sales module)
- **Map**: `getMapPartners(params)` -- supports `bbox` (south,west,north,east), `zoom`, plus partner type/status/campaign filters
- **Geo Queue**: `getPartnersWithoutGeo(params)` -- calls `GET /api/mpromo/partners?geo_missing=true`

Scope parameter logic:
- If `scope.mode === "all"`: append `?scope=all` to requests
- If `scope.mode === "target"`: append `?target_team_id=<id>` to requests
- If `scope.mode === "current"` or undefined: no extra params (uses `X-Team-ID` as normal)

In demo mode, each returns typed empty arrays/placeholder structures.

---

## 8. Pages

### 8a. Overview (`src/pages/mpromo/MPromoOverview.tsx`)
- 4 KPI cards: Active Campaigns, Today's Redemptions, Pending Payouts, Orders Today
- In "All Teams" scope mode, KPIs show aggregated totals with a "All Teams" label
- Top Partners widgets (Chillers / Ice Water Sellers) as ranked lists
- Recent activity feed
- Chart placeholders (recharts, already installed)

### 8b. Partners List (`src/pages/mpromo/MPromoPartners.tsx`)
- Tabs: Chillers | Ice Water Sellers
- DataTable: Name, Phone, Location, Status, Last Activity, Geo Status, Actions
- "Add Partner" and "Import CSV" buttons (permission-gated, disabled in "All Teams" mode)
- Action dropdown: View, Edit, Suspend/Activate
- **New filter preset**: "Location missing" toggle that filters to partners without geolocation

### 8c. Partner Detail (`src/pages/mpromo/MPromoPartnerDetail.tsx`)
- Summary card with partner info, status, and geolocation display
- Tabs: Activity (timeline), Redemptions (table), Orders (table)
- Edit / Suspend buttons (permission-gated)
- Geolocation section: "Use my current location" button, "Pick on map" button (opens MapPickerModal), lat/lng fields

### 8d. Geo Registration Queue (`src/pages/mpromo/MPromoGeoQueue.tsx`) (NEW)
- Lists partners with missing coordinates, sorted by last activity (most active first)
- Columns: Name, Type, Phone, Location (text), Last Activity, Action
- Each row has a "Capture Location" button that:
  - Option 1: "Use my current location" (browser geolocation API)
  - Option 2: "Pick on map" (opens MapPickerModal)
- On capture, calls `PUT /api/mpromo/partners/:id/geolocation` and removes from list
- Search + filter by partner type

### 8e. Campaigns List (`src/pages/mpromo/MPromoCampaigns.tsx`)
- DataTable: Name, Type, Status, Dates, Redemptions, Spend, Team (shown in "All Teams" mode), Actions
- Filters: status, type, date range
- "Create Campaign" button: permission-gated, uses `target_team_id` in "Act on Team" mode, disabled in "All Teams" mode

### 8f. Campaign Create (`src/pages/mpromo/MPromoCampaignCreate.tsx`)
- 3-step wizard:
  - Step 1: Name, type (VOLUME_REBATE / MYSTERY_SHOPPER), date range. In "Act on Team" mode, show target team name as context
  - Step 2: Rules (tier builder for VOLUME_REBATE, reward amount for MYSTERY_SHOPPER)
  - Step 3: Review + Create
- Passes `target_team_id` from scope context when submitting
- Validation with react-hook-form + zod, loading states, toasts

### 8g. Campaign Detail (`src/pages/mpromo/MPromoCampaignDetail.tsx`)
- Summary card with status controls (Activate/Pause/End) -- permission-gated, disabled in "All Teams" mode
- Performance: chart placeholder, spend, top partners
- Embedded codes and redemptions tables with "View all" links

### 8h. Codes (`src/pages/mpromo/MPromoCodes.tsx`)
- Generate codes panel (quantity, expiry, campaign select) -- permission-gated, uses scope context for target_team_id, disabled in "All Teams" mode
- DataTable: Code, Campaign, Issued To, Status, Expires, Redeemed At
- Export CSV (placeholder), Cancel code action

### 8i. Redemptions (`src/pages/mpromo/MPromoRedemptions.tsx`)
- Read-only DataTable: Date/Time, Partner, Partner Type, Campaign, Amount, Payout Status, Reference
- Filters: date range, campaign, payout status, partner type

### 8j. Payouts (`src/pages/mpromo/MPromoPayouts.tsx`)
- Two sections: Pending queue + Paid history
- "Pay now" and "Retry" actions -- permission-gated, disabled in "All Teams" mode
- Paid table: Partner, Amount, Paystack Reference, Date

### 8k. Orders (`src/pages/mpromo/MPromoOrders.tsx`)
- Consumes `GET /api/sales/orders?source=MPROMO` (aligned with Sales module)
- DataTable: Order No, Partner, Date, Total, Status, Actions
- "View in Sales" links to `/sales/orders/:id`
- In "All Teams" mode, shows a Team column
- Permission-gated by `mpromo.orders.view`

### 8l. Map (`src/pages/mpromo/MPromoMap.tsx`)
- Uses `leaflet` + `react-leaflet` with marker clustering
- Theme-aware tiles: OpenStreetMap for light mode, CartoDB Dark Matter for dark mode
- **Viewport-based loading**: on `moveend`/`zoomend`, debounced (300ms) call to `getMapPartners({ bbox, zoom, ...filters })` -- only loads pins visible in the current viewport
- Filters above map: partner type, status, date range, campaign, inactive toggle, search
- Clicking a marker opens a side panel with partner summary, metrics, and links
- Heatmap layer toggle (placeholder UI control)

**Create `src/components/mpromo/MapPickerModal.tsx`**
- Modal with a Leaflet map for dropping a pin
- Returns `{ latitude, longitude }` on confirm
- Used in Partner Detail geo section and Geo Queue

---

## 9. New Dependencies

- `leaflet` -- map rendering
- `react-leaflet` -- React wrapper for Leaflet
- `@types/leaflet` -- TypeScript types

---

## 10. Files Summary

| Action | File |
|--------|------|
| Modify | `src/config/navigation.ts` |
| Modify | `src/providers/AuthProvider.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/components/layout/Breadcrumbs.tsx` |
| Create | `src/types/mpromo.ts` |
| Create | `src/lib/api/mpromo.ts` |
| Create | `src/providers/MPromoScopeProvider.tsx` |
| Create | `src/components/mpromo/ScopeSelector.tsx` |
| Create | `src/components/mpromo/MPromoLayout.tsx` |
| Create | `src/components/mpromo/MapPickerModal.tsx` |
| Create | `src/components/shared/DataTable.tsx` |
| Create | `src/components/shared/KpiCard.tsx` |
| Create | `src/components/shared/StatusBadge.tsx` |
| Create | `src/pages/mpromo/MPromoOverview.tsx` |
| Create | `src/pages/mpromo/MPromoPartners.tsx` |
| Create | `src/pages/mpromo/MPromoPartnerDetail.tsx` |
| Create | `src/pages/mpromo/MPromoGeoQueue.tsx` |
| Create | `src/pages/mpromo/MPromoCampaigns.tsx` |
| Create | `src/pages/mpromo/MPromoCampaignCreate.tsx` |
| Create | `src/pages/mpromo/MPromoCampaignDetail.tsx` |
| Create | `src/pages/mpromo/MPromoCodes.tsx` |
| Create | `src/pages/mpromo/MPromoRedemptions.tsx` |
| Create | `src/pages/mpromo/MPromoPayouts.tsx` |
| Create | `src/pages/mpromo/MPromoOrders.tsx` |
| Create | `src/pages/mpromo/MPromoMap.tsx` |

---

## Key Refinements from Previous Plan

### HQ Global Mode
- `MPromoScopeProvider` context manages scope state across all pages
- `ScopeSelector` component shows Current Team / All Teams / Act on Team controls
- All API stubs accept scope and pass `?scope=all` or `?target_team_id=<id>` as query params
- `X-Team-ID` header is never modified (always auth context); scope is a separate concern
- All write actions are disabled in "All Teams" mode; "Act on Team" requires `mpromo.hq.run_campaigns_any_team`
- Tables show a "Team" column when viewing All Teams

### Map Performance
- `getMapPartners()` accepts `bbox` (bounding box as `south,west,north,east`) and `zoom` parameters
- Map component listens to `moveend`/`zoomend` events with a 300ms debounce
- Only requests partners visible in the current viewport, not all partners globally

### Orders Integration
- M-Promo orders page calls `GET /api/sales/orders?source=MPROMO` instead of a separate mpromo-specific orders endpoint
- `MPromoOrder` type mirrors the Sales Order shape with a `source` field
- "View in Sales" link preserved

### Geo Registration Queue
- New `/mpromo/geo-queue` route and page for quickly capturing missing partner locations
- Partners list gains a "Location missing" filter toggle
- `Partner` type includes `latitude`, `longitude`, `geolocation_captured_at` fields

