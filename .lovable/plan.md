

## Plan: Switch to Bulk Import Endpoint

### Summary
Replace the sequential `createPartner()` loop with a single `importPartners()` API call, simplify the importing screen, and update imports.

### Changes

#### 1. `src/lib/api/mpromo.ts`
Add `importPartners()` function after `createPartner` — accepts array of row objects + scope, returns `{ imported, failed, errors }`. Includes DEMO_MODE path with duplicate-phone simulation.

#### 2. `src/components/mpromo/ImportPartnersDialog.tsx`
- Replace `import { createPartner }` with `import { importPartners }`
- Remove `importProgress` state and `Progress` import
- Replace `handleImport` with single API call version that maps backend error map to `ImportResult[]`, with catch block for whole-request failures
- Replace importing screen's progress bar with simple "Importing N partners..." message (use a Loader2 spinner)

No changes to template download, file parsing, validation, preview table, or done screen.

