

## Update Permission Slugs, Granular Guards, and Market Data API

### Overview
Nine changes across 12 files: update demo permission slugs, replace coarse `canManage` flags with granular permission checks, and rewrite the market-data API layer from in-memory to real backend calls.

### Changes

**1. `src/providers/AuthProvider.tsx`** — Replace all three team permission arrays with the new granular slugs provided.

**2. `src/components/mpromo/MPromoLayout.tsx`** — Update `permission` on nav tabs:
- Partners → `mpromo.partners.view`
- Campaigns → `mpromo.campaigns.view`
- Codes → `mpromo.codes.view`
- Payouts → `mpromo.payouts.view`
- Geo Queue → `mpromo.partners.view`
- Redemptions/Orders already correct, Overview/Market Data/Map stay ungated

**3. `src/pages/mpromo/MPromoPartners.tsx`** — Split `canManage` into `canCreate` (`mpromo.partners.create`) and `canSuspend` (`mpromo.partners.suspend`). Edit dropdown item always visible; Suspend/Activate uses `canSuspend`; header buttons use `canCreate`.

**4. `src/pages/mpromo/MPromoPartnerDetail.tsx`** — Split `canManage` into `canUpdate` (`mpromo.partners.update`), `canSuspend` (`mpromo.partners.suspend`), `canPoints` (`mpromo.partners.points`). Map each button to its flag.

**5. `src/pages/mpromo/MPromoCampaigns.tsx`** — Fix slug: `mpromo.campaign.manage` → `mpromo.campaigns.manage`

**6. `src/pages/mpromo/MPromoCampaignDetail.tsx`** — Fix slug + add `canActivate` (`mpromo.campaigns.activate`). Activate/Pause/End buttons use `canActivate`; other edit actions keep `canManage`.

**7. `src/pages/mpromo/MPromoCodes.tsx`** — Split into `canGenerate` (`mpromo.codes.generate`) and `canCancel` (`mpromo.codes.cancel`). Generate panel uses `canGenerate`; cancel column uses `canCancel`.

**8. `src/pages/mpromo/MPromoPayouts.tsx`** — Rename `canManage` → `canTrigger` (`mpromo.payouts.trigger`).

**9. `src/lib/api/market-data.ts`** — Full rewrite: remove in-memory state, use `api` axios instance for all CRUD and aggregation endpoints. `getFormHeatMetricOptions` and `getGroupByValues` become async.

**10. `src/components/mpromo/map/MapFilterBar.tsx`** — Update callers: `await getFormHeatMetricOptions()` and `await getGroupByValues(...)` inside their respective `useEffect` hooks (already async-compatible since they're in effects).

**11. `src/components/mpromo/map/useMapHeatLayer.ts`** — `getMetricLabel` and `getHeatMetricIntensityLabel` call `getFormHeatMetricOptions` synchronously. Refactor: accept a cached `formOptions` array as a parameter (passed from the parent component which already fetches it), or fetch once in the hook's effect and store in a ref. The simplest approach: the hook already receives `metric` — add an optional `metricLabel` prop from the parent (MapFilterBar already computes this), so the hook doesn't need to call the API at all. Alternatively, cache options in a `useEffect` + `useRef` inside the hook.

### Technical Detail: useMapHeatLayer sync→async

The functions `getMetricLabel` and `getHeatMetricIntensityLabel` are called synchronously during render/effect. Strategy: add a `formMetricOptions` state inside the hook, fetch once via `useEffect`, and use it in both label functions (falling back to generic labels until loaded). This is a minimal change that doesn't affect the hook's external API.

### Implementation Order
1. Types/permissions (AuthProvider, MPromoLayout)
2. Page-level permission splits (Partners, PartnerDetail, Campaigns, CampaignDetail, Codes, Payouts)
3. Market data API rewrite
4. Caller updates (MapFilterBar, useMapHeatLayer)

