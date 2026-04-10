

## Plan: Fix `getPartnerPointsHistory` API response unwrapping

**What**: Change `return res.data` to `return res.data.data` in the live API path of `getPartnerPointsHistory` to correctly unwrap the paginated envelope.

**Where**: `src/lib/api/mpromo.ts`, line ~196 (the `return res.data;` after the `api.get` call in the non-demo branch).

Single-line change, no other files affected.

