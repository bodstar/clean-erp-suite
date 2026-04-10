

## Plan: Reduce batch code page size to 10

**File**: `src/components/mpromo/BatchCard.tsx`

Two changes:
1. `handleToggle`: change `page_size: 20` → `page_size: 10`
2. `handleLoadMore`: change `page_size: 20` → `page_size: 10`

