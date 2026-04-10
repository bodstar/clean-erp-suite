

## Plan: Pass scope to all exportList calls

The `exportList` helper and all call sites already exist. The only change needed is to add scope support to the helper and pass `scope` from each page.

### Changes

**1. `src/lib/api/mpromo.ts`** (lines 696-703)
- Add `scope?: MPromoScope` as third parameter
- Merge `scopeParams(scope)` into the POST body alongside `params`

**2. Six list pages** — update existing `exportList(...)` calls to pass `scope` as third argument:
- `MPromoPartners.tsx` — add `, scope` and change `search` to `search: search || undefined`
- `MPromoRedemptions.tsx` — add `, scope`  and change `search` to `search: search || undefined`
- `MPromoPayouts.tsx` — add `, scope` to both pending and paid calls, and change `search` to `search: search || undefined`
- `MPromoOrders.tsx` — add `, scope` and change `search` to `search: search || undefined`
- `MPromoGeoQueue.tsx` — add `, scope`

**3. Two detail pages** — no scope needed (already scoped by ID), no changes:
- `MPromoCampaignDetail.tsx` — unchanged
- `MPromoPartnerDetail.tsx` — unchanged

Total: 7 files edited (1 API + 6 list pages). No new buttons, no new state, no layout changes.

