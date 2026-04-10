

## Plan: Fix `getCampaignCodeBatches` response unwrapping

One-line fix in `src/lib/api/mpromo.ts`: change `return res.data` to `return res.data.data` in the live API path of `getCampaignCodeBatches`, matching the paginated envelope pattern used by other endpoints.

### Change
**File**: `src/lib/api/mpromo.ts`
- In `getCampaignCodeBatches`, update `return res.data` → `return res.data.data`

