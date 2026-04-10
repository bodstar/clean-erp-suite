

## Plan: Lazy Code Loading + Server-Side Export

### Summary
Replace eager full-batch loading with paginated `getBatchCodes` endpoint, add server-side export via `signBatchExport`, and add "Load more" pagination to the code table.

### Changes

#### 1. `src/lib/api/mpromo.ts` — Add two new API functions after `getCodeBatch`
- `getBatchCodes(batchId, params?)` — paginated code fetch from `/mpromo/codes/batches/{id}/codes`, demo fallback filters from `getCodeBatch`
- `signBatchExport(batchId)` — POST to `/mpromo/codes/batches/{id}/export/sign`, returns `{ pdf_url, excel_url }`, demo returns empty strings

#### 2. `src/components/mpromo/BatchCard.tsx` — Update BatchCard function only

**State**: Replace `codes` with `visibleCodes`, add `codesPage`, `codesTotal`, `codesLastPage`

**Handlers**:
- `handleToggle`: calls `getBatchCodes(batch.id, { page: 1, page_size: 20 })` instead of `getCodeBatch`
- New `handleLoadMore`: appends next page of codes
- `handleExportPDF`/`handleExportCSV`: call `signBatchExport`, open URL if returned, fallback to client-side export in demo mode using `getBatchCodes` with `status: 'active'`
- `handleCancelCode`: uses `visibleCodes` setter

**Render**: Replace `{expanded && codes && (...)}` block with `visibleCodes` + conditional "Load more" button when `codesPage < codesLastPage`

**Import**: Replace `getCodeBatch` with `getBatchCodes, signBatchExport`

No changes to BatchCodeTable, export functions, BatchCardProps, or any other files.

