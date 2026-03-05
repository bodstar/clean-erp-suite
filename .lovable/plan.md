

## Add Team Badge Column to All MPromo List Pages (All Teams Scope)

### Summary
When an HQ user views data in "All Teams" scope, every list page should show a **Badge** column indicating which team owns each row. Currently, Campaigns and Orders show a plain-text "Team" column. This plan upgrades those to badges and adds the team column to Partners, Codes, Redemptions, and Payouts.

### Changes

**1. Create a reusable `TeamBadge` component** — `src/components/shared/TeamBadge.tsx`
A small component that renders the team name inside a `<Badge variant="secondary">`. Returns null/dash if no team name is provided.

**2. Add `team_name` to child entity types** — `src/types/mpromo.ts`
Add optional `team_name?: string` and `team_id?: number` to `PromoCode`, `Redemption`, and `Payout` interfaces.

**3. Enrich child entities with team info in the API layer** — `src/lib/api/mpromo.ts`
In demo mode, after filtering, map `team_name` onto Codes and Redemptions (via campaign → team lookup) and Payouts (via partner → team lookup) before returning results.

**4. Update all 6 list pages** to conditionally add a Team badge column when `scopeMode === "all"`:

| Page | File | Current state | Change |
|------|------|--------------|--------|
| Partners | `MPromoPartners.tsx` | No team column | Add team badge column |
| Campaigns | `MPromoCampaigns.tsx` | Plain text column | Replace with badge render |
| Orders | `MPromoOrders.tsx` | Plain text column | Replace with badge render |
| Codes | `MPromoCodes.tsx` | No team column | Add team badge column |
| Redemptions | `MPromoRedemptions.tsx` | No team column | Add team badge column |
| Payouts | `MPromoPayouts.tsx` | No team column (2 tables) | Add team badge column to both pending and paid tables |

Each page already imports `useMPromoScope` and has `scopeMode`. The conditional column pattern (`...(scopeMode === "all" ? [column] : [])`) is already used in Campaigns and Orders — same pattern applied everywhere.

### Files modified
- `src/components/shared/TeamBadge.tsx` (new)
- `src/types/mpromo.ts`
- `src/lib/api/mpromo.ts`
- `src/pages/mpromo/MPromoPartners.tsx`
- `src/pages/mpromo/MPromoCampaigns.tsx`
- `src/pages/mpromo/MPromoOrders.tsx`
- `src/pages/mpromo/MPromoCodes.tsx`
- `src/pages/mpromo/MPromoRedemptions.tsx`
- `src/pages/mpromo/MPromoPayouts.tsx`

