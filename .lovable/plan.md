

## Add Demo Data for the M-Promo Module

Currently, when the app runs without a backend (`DEMO_MODE`), every M-Promo API call returns empty arrays and zeroes. This plan populates all M-Promo pages with realistic dummy data so the module can be explored and demonstrated without a live backend.

---

### 1. Create a new demo data file

**New file: `src/lib/demo/mpromo-data.ts`**

This file will export pre-built arrays of realistic Nigerian-context demo records:

- **Partners (12)**: Mix of CHILLERs and ICE_WATER_SELLERs across Accra/Lagos-area locations, with varied statuses, some with geo coordinates and some without
- **Campaigns (6)**: Mix of VOLUME_REBATE and MYSTERY_SHOPPER types in all statuses (draft, active, paused, ended) with tier data and spend figures
- **Promo Codes (15)**: Linked to campaigns, mix of active/redeemed/expired statuses with realistic code strings
- **Redemptions (10)**: Linked to partners and campaigns, varied payout statuses and amounts
- **Payouts (8)**: Linked to partners, mix of pending/paid/failed statuses with Paystack references
- **Orders (10)**: Linked to partners, varied order statuses with realistic totals
- **Map Partners (8)**: Subset of partners with full geo data plus aggregated redemption/order/payout stats
- **Overview KPIs**: Pre-computed summary with top chillers, top ice water sellers, and recent activity entries

All dates will use relative date-fns helpers so they stay current.

---

### 2. Update the API layer to return demo data

**Modified file: `src/lib/api/mpromo.ts`**

Replace every `DEMO_MODE` return with imports from the demo data file. Add basic client-side filtering/search/pagination to make the demo feel interactive:

- **getOverview**: Return the pre-built overview object
- **getPartners**: Return filtered by `type`, `search` (name match), `geo_missing`, with simple pagination
- **getPartner**: Find by ID from the partners array
- **getCampaigns**: Return filtered by `status`, `search`, with pagination
- **getCampaign**: Find by ID from campaigns array
- **getCodes**: Return filtered by `search` (code match), with pagination
- **getRedemptions**: Return with pagination
- **getPayouts**: Return with pagination
- **getOrders**: Return with pagination
- **getMapPartners**: Return the map partners array, filtered by `type`/`status`/`search`
- **getPartnersWithoutGeo**: Return partners where latitude is null, filtered by `type`/`search`

Write operations (`createPartner`, `suspendPartner`, `generateCodes`, `payPayout`, etc.) will remain as-is since they require a real backend.

---

### Technical Details

| File | Action |
|------|--------|
| `src/lib/demo/mpromo-data.ts` | New -- all demo datasets |
| `src/lib/api/mpromo.ts` | Modified -- replace empty DEMO_MODE returns with demo data + client-side filtering |

No new dependencies needed. No UI changes required -- the existing pages will automatically display the data.
