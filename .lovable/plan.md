

## Plan: Import Partners Workflow

### Summary
Create an `ImportPartnersDialog` component with a 4-step wizard (upload → preview → importing → done) and wire it into the existing Import CSV button on the partners page.

### Files

#### 1. Create `src/components/mpromo/ImportPartnersDialog.tsx`
New dialog component with these props:
```typescript
{ open: boolean; onOpenChange: (v: boolean) => void; scope?: MPromoScope; onSuccess: () => void }
```

**State machine**: `step: 'upload' | 'preview' | 'importing' | 'done'`

**Screen 1 — Upload**:
- Instructions listing the 6 columns and their rules
- "Download Template" button — generates CSV with header row + example row + comment row (prefixed with `#`) explaining field rules, triggers browser download
- File input accepting `.csv` only
- On file select: parse CSV (split newlines → split commas → trim → skip header & `#` comment rows), validate each row against rules, transition to `preview`

**Validation rules** (per row):
- `name` non-empty
- `phone` matches `/^0[2-9]\d{8}$/`
- `type` is `CHILLER` or `ICE_WATER_SELLER`
- `location` non-empty
- `latitude` if present: valid number -90..90
- `longitude` if present: valid number -180..180

**Screen 2 — Preview**:
- Summary line: "X ready, Y errors"
- Scrollable table (`max-h-80 overflow-y-auto`) showing parsed rows with columns: Row#, Name, Phone, Type, Location, Lat, Lng, Status (check/X + error text)
- "Import" button enabled only when ≥1 valid row; "Back" to return to upload screen

**Screen 3 — Importing**:
- Progress bar + "Importing partner N of M..."
- Calls `createPartner()` sequentially for each valid row with `{ name, phone, type, location, latitude, longitude }` and the passed `scope`
- Tracks successes and failures (captures error message from API response on 422s)
- Does not abort on individual failures

**Screen 4 — Done**:
- Summary: "X imported successfully, Y failed"
- If failures: table listing failed rows with error reasons
- "Done" button closes dialog
- If any successes occurred, calls `onSuccess` when dialog closes

#### 2. Update `src/pages/mpromo/MPromoPartners.tsx`
- Add `importOpen` state
- Change Import CSV button `onClick` to `() => setImportOpen(true)`
- Render `<ImportPartnersDialog>` with `open`, `onOpenChange`, `scope`, and `onSuccess` that resets page to 1 and triggers refetch (toggle a `refetchKey` counter in the dependency array of the existing `useEffect`)
- Import the dialog component

### Technical Details
- Uses shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Button`, `Progress`, `Table` components
- CSV parsing: pure JS — `text.split('\n')`, filter empty/comment rows, `.split(',')`, `.map(s => s.trim())`
- Template download: create Blob with `text/csv` type, use URL.createObjectURL + hidden anchor click
- CSV export uses same pattern already established in the codebase (MPromoCodes page)
- No external CSV library needed

