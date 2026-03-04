

## Strict Tenant Scoping for MPromo Demo Mode

### Summary
Add `team_id` to root entities (Partners, MapPartners), build a reusable scoping helper that enforces HQ/non-HQ rules, and apply team filtering across every demo-mode API function. Child entities (codes, redemptions, payouts) inherit team via parent lookups.

### Changes

**1. `src/types/mpromo.ts`** — Add `team_id?: number` and `team_name?: string` to `Partner` and `MapPartner` interfaces.

**2. `src/lib/demo/mpromo-data.ts`** — Assign `team_id` + `team_name` to all Partner and MapPartner records:

| Team | Partners (by location) |
|------|----------------------|
| 1 — Magvlyn HQ | 1 (Osu), 3 (Cantonments), 6 (Dansoman), 10 (Achimota) |
| 2 — Franchise – Accra Central | 2 (Madina), 4 (East Legon), 5 (Tema), 8 (Airport), 12 (Spintex) |
| 3 — Franchise – Kumasi | 7 (Kumasi), 9 (Takoradi), 11 (Kasoa) |

Campaigns already have `team_id`. Orders already have `team_id`. No changes needed there.

**3. `src/providers/AuthProvider.tsx`** — Add Team 3 "Franchise – Kumasi" to `DEMO_DATA.teams` with basic mpromo permissions (no `global_view`).

**4. `src/lib/api/mpromo.ts`** — Core filtering logic:

- **`resolveEffectiveScope(scope?)`**: Reads `currentTeamId` and permissions from `localStorage`. If user lacks `mpromo.hq.global_view`, forces `mode="current"` regardless of passed scope. Returns `{ mode, teamId }`.

- **`demoTeamFilter<T>(items, scope, teamIdAccessor)`**: Generic filter. For root entities with `team_id`, filters directly. Returns filtered array.

- **Parent lookup maps** built lazily: `campaignTeamMap` (campaign_id → team_id from `demoCampaigns`), `partnerTeamMap` (partner_id → team_id from `demoPartners`). Used for child entity filtering.

- Apply filtering in every DEMO_MODE branch:
  - `getOverview`: Compute KPIs dynamically from filtered redemptions/orders/campaigns/payouts
  - `getPartners`, `getPartner`, `getPartnersWithoutGeo`, `getMapPartners`: Filter by partner `team_id`
  - `getCampaigns`, `getCampaign`: Filter by campaign `team_id`
  - `getCodes`, `getCampaignCodes`: Inherit team from campaign via `campaignTeamMap`
  - `getRedemptions`, `getCampaignRedemptions`, `getPartnerRedemptions`: Inherit team from campaign via `campaignTeamMap`
  - `getPayouts`: Inherit team from partner via `partnerTeamMap`
  - `getOrders`, `getPartnerOrders`: Filter by order `team_id`

**5. `src/providers/MPromoScopeProvider.tsx`** — Import `useAuth`, check `hasPermission("mpromo.hq.global_view")`. In `setScopeMode` wrapper, if user lacks permission, force mode to `"current"` silently. This prevents non-HQ users from ever holding an "all" or "target" scope in state.

### Technical notes
- The scoping helper reads from `localStorage("clean-team-id")` and `localStorage("clean-token")` for permission check (parsing demo teams) since the API module doesn't have React context access. Alternatively, scope + currentTeamId are already passed as params to most functions — we can add `currentTeamId` as an extra param to demo helpers.
- Simpler approach: since every API call site already has access to `useMPromoScope()` and `useAuth()`, we pass `currentTeamId` into the scope object or as a separate param. The `MPromoScope` type gets an additional `currentTeamId` field populated by the provider, keeping the API module pure (no localStorage reads).
- Overview becomes dynamic: sum filtered redemptions, count filtered campaigns with status "active", etc.

### Files modified
- `src/types/mpromo.ts`
- `src/lib/demo/mpromo-data.ts`
- `src/lib/api/mpromo.ts`
- `src/providers/AuthProvider.tsx`
- `src/providers/MPromoScopeProvider.tsx`

