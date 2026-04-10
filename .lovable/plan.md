

## Plan: Fix `getCampaignCodeBatches` response unwrapping

**File**: `src/lib/api/mpromo.ts`

Change `return res.data.data` back to `return res.data` in the live API path of `getCampaignCodeBatches`, since this endpoint returns a plain array, not a paginated envelope.

