

## Plan: Safety guards for `codeBatches` state

Two small fixes in `src/pages/mpromo/MPromoCampaignDetail.tsx`:

1. **`.then()` handler**: Change `setCodeBatches(batchesRes)` to `setCodeBatches(Array.isArray(batchesRes) ? batchesRes : batchesRes?.data ?? [])`
2. **`.catch()` handler**: Add `setCodeBatches([])` after `setCampaign(null)`

No other files or changes.

