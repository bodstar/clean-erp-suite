

## Fix: KPI card text overflow on campaign detail overview

**Problem**: The "Total Spend" KPI card (and potentially others) allows long values like `GH₵1,234,567,890` to overflow horizontally beyond the card boundaries, especially on smaller viewports where the 4-column grid compresses card widths.

**Root cause**: The KPI cards use raw `<p className="text-2xl font-bold">` without any overflow or text-sizing constraints.

**Solution**: Add overflow protection and responsive text sizing to all four KPI cards in the overview grid (lines 257-285):

1. Add `overflow-hidden` to each `CardContent` container
2. Add `truncate` to the value `<p>` tags so long numbers are clipped gracefully
3. Reduce font size responsively: use `text-lg sm:text-2xl` so values scale down on narrow cards
4. Add `min-w-0` to the card content to allow flex/grid truncation to work properly

This is a small, targeted fix affecting only the four KPI cards in the overview tab of `MPromoCampaignDetail.tsx`.

