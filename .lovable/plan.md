

## Plan: Replace load-more with pagination + search in BatchCard

### Files to change

**1. `src/components/mpromo/BatchCard.tsx`**
- Add `Input` import
- Add `codesSearch` and `searchInput` state
- Add `fetchCodes(page, search)` helper consolidating all fetch logic
- Replace `handleToggle` to use `fetchCodes`
- Add `handleSearch` handler
- Remove `handleLoadMore`
- Replace expanded section: add search bar (Input + Search/Clear buttons) above the table, and a prev/next pagination footer below when `codesLastPage > 1`

**2. `src/lib/api/mpromo.ts`**
- Add `search?: string` to `getBatchCodes` params type

All changes exactly as specified in the user's message.

