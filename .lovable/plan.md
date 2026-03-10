

## Add Loyalty Points to Partners and Campaign Rules

### Summary
Add a `loyalty_points` field to partners and a `loyalty_points` reward field to campaign rules, so each campaign defines how many loyalty points a partner earns per redemption, and each partner accumulates a visible points balance.

### Changes

**1. `src/types/mpromo.ts`**
- Add `loyalty_points: number` to `Partner` interface
- Add `loyalty_points: number` to `CampaignTier` interface (for Volume Rebate — points per tier)
- Add `loyalty_points?: number` to `Campaign` interface (for Mystery Shopper — flat points per redemption)
- Add `loyalty_points: number` to `MapPartner` interface

**2. `src/lib/demo/mpromo-data.ts`**
- Add `loyalty_points` values to each demo partner (varying amounts like 120, 85, 200, etc.)
- Add `loyalty_points` to each campaign tier and campaign `loyalty_points` for Mystery Shopper campaigns
- Add `loyalty_points` to demo map partners

**3. `src/pages/mpromo/MPromoCampaignCreate.tsx`** (Step 2 — Rules)
- For Volume Rebate: add a "Loyalty Points" input field next to each tier's threshold and reward amount
- For Mystery Shopper: add a "Loyalty Points per Redemption" input below the reward amount
- Update `CampaignTier` state to include `loyalty_points`
- Add `loyalty_points` to the Step 3 review summary
- Pass `loyalty_points` through to `createCampaign`

**4. `src/pages/mpromo/MPromoCampaignDetail.tsx`**
- Display loyalty points in the tiers table (new column)
- Display loyalty points for Mystery Shopper campaigns next to the reward amount

**5. `src/pages/mpromo/MPromoPartners.tsx`**
- Add a "Points" column to the partners DataTable showing `loyalty_points`

**6. `src/pages/mpromo/MPromoPartnerDetail.tsx`**
- Show loyalty points balance prominently in the header card (e.g. a badge or stat next to the partner name)

**7. `src/pages/mpromo/MPromoPartnerCreate.tsx`**
- No change needed — new partners start with 0 loyalty points (set by backend/demo data)

### Files modified
- `src/types/mpromo.ts`
- `src/lib/demo/mpromo-data.ts`
- `src/pages/mpromo/MPromoCampaignCreate.tsx`
- `src/pages/mpromo/MPromoCampaignDetail.tsx`
- `src/pages/mpromo/MPromoPartners.tsx`
- `src/pages/mpromo/MPromoPartnerDetail.tsx`

