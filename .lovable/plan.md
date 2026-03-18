

## Plan: Add redemption amount to codes

**What changes**: Codes will carry a `redemption_amount` field that defines how much a partner can redeem. When generating codes, the admin selects a tier (for Volume Rebate campaigns) or the amount is auto-filled (for Mystery Shopper campaigns).

### 1. Update `PromoCode` type
Add `redemption_amount: number` to the `PromoCode` interface in `src/types/mpromo.ts`.

### 2. Update demo data
Add `redemption_amount` to each entry in `demoCodes` in `src/lib/demo/mpromo-data.ts`, derived from their parent campaign's reward rules.

### 3. Update code generation UI (`MPromoCodes.tsx`)
- When a campaign is selected, check its type:
  - **Volume Rebate**: Show a tier selector dropdown listing the campaign's tiers (e.g., "50+ cases → GH₵200"). The selected tier's `reward_amount` becomes the code's `redemption_amount`.
  - **Mystery Shopper**: Auto-fill and display the campaign's `reward_amount` as a read-only field (no tier selection needed).
- Pass `redemption_amount` to the `generateCodes` API call.

### 4. Update `generateCodes` API function
Add `redemption_amount: number` to the data parameter in `src/lib/api/mpromo.ts`.

### 5. Display redemption amount in codes table
Add a "Value" column to the codes table in `MPromoCodes.tsx` showing `GH₵{code.redemption_amount}`. Also add it to the codes tab on `MPromoCampaignDetail.tsx`.

### 6. Files affected
- `src/types/mpromo.ts` — add field to `PromoCode`
- `src/lib/demo/mpromo-data.ts` — add values to demo codes
- `src/lib/api/mpromo.ts` — update `generateCodes` signature
- `src/pages/mpromo/MPromoCodes.tsx` — tier/amount selector + value column
- `src/pages/mpromo/MPromoCampaignDetail.tsx` — value column in codes tab

