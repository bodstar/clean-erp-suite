

## Plan: Add Export buttons across MPromo pages

### 1. `src/lib/api/mpromo.ts` — Add shared `exportList` helper

Add the `exportList` function that POSTs to a sign endpoint, extracts the signed URL from the response, and opens it in a new tab.

### 2. `src/pages/mpromo/MPromoPartners.tsx`

- Import `Download` from lucide-react and `exportList` from api
- Add `isExporting` state
- Add Export button in `headerActions` div (alongside Add Partner / Import CSV), calling `exportList('/mpromo/export/partners/sign', { search, type, geo_missing })` with loading/error handling

### 3. `src/pages/mpromo/MPromoRedemptions.tsx`

- Import `Download` and `exportList`
- Add `isExporting` state
- Wrap `DataTable` in a container div with an Export button above it, calling `exportList('/mpromo/export/redemptions/sign', { search, payout_status })`

### 4. `src/pages/mpromo/MPromoPayouts.tsx`

- Import `Download` and `exportList`
- Add `isExportingPending` and `isExportingPaid` states
- Add Export button in the Pending card's `CardHeader` and the Paid card's `CardHeader`, each calling `exportList('/mpromo/export/payouts/sign', { search, status })` with their respective status

### 5. `src/pages/mpromo/MPromoOrders.tsx`

- Import `Download` and `exportList`
- Add `isExporting` state
- Wrap `DataTable` in a container div with an Export button above it, calling `exportList('/mpromo/export/orders/sign', { search })`

### 6. `src/pages/mpromo/MPromoGeoQueue.tsx`

- Import `Download` and `exportList`
- Add `isExporting` state
- Add Export button in the page header area, calling `exportList('/mpromo/export/geo-queue/sign', { search, type })`

### 7. `src/pages/mpromo/MPromoCampaignDetail.tsx`

- Import `Download` and `exportList`
- Add `isExporting` state
- Add Export button in the header action buttons area (next to Activate/Pause/End), shown only when `campaign` is loaded, calling `exportList(`/mpromo/export/campaign/${campaign.id}/sign`)`

### 8. `src/pages/mpromo/MPromoPartnerDetail.tsx`

- Import `Download` and `exportList`
- Add `isExporting` state
- Add Export button in the partner header action buttons area (next to Edit/Adjust Points/Suspend), shown only when `partner` is loaded, calling `exportList(`/mpromo/export/partner/${partner.id}/sign`)`

### Common pattern for all Export buttons

```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1.5"
  disabled={isExporting}
  onClick={async () => {
    setIsExporting(true);
    try { await exportList('/mpromo/export/...', { ... }); }
    catch { toast.error('Export failed'); }
    finally { setIsExporting(false); }
  }}
>
  <Download className="h-4 w-4" />
  {isExporting ? 'Exporting...' : 'Export'}
</Button>
```

**Files to edit**: 8 files total. No existing functionality, layout, or buttons are changed.

