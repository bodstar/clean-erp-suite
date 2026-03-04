

## Replace Redemptions Trend Placeholder with Recharts Line Chart

**File: `src/pages/mpromo/MPromoOverview.tsx`**

### Changes

1. **Add imports**: `getRedemptions` from API, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from chart UI, and `LineChart`, `Line`, `CartesianGrid`, `XAxis`, `YAxis` from recharts.

2. **Add state + effect**: New `trendData` state (`{ label: string; count: number }[]`) and `trendLoading` boolean. Second `useEffect` on `[scope]` that calls `getRedemptions({ page: 1, page_size: 500 }, scope)`, groups results by day, and builds a 14-day array (oldest→newest) with zero-filled gaps.

3. **Replace the placeholder card content** (lines ~145-150) with:
   - Loading: `<Skeleton className="h-48 w-full" />`
   - Otherwise: `<ChartContainer>` wrapping a `<LineChart>` with `XAxis dataKey="label"`, `YAxis`, `CartesianGrid`, `ChartTooltip`, and a single `<Line dataKey="count">`. Chart config uses a single `count` key with `hsl(var(--primary))` color.

4. **Date grouping logic**: Use `new Date()` to build last 14 days array, format labels with `toLocaleDateString(undefined, { month: "short", day: "numeric" })`, match redemption dates by `YYYY-MM-DD` prefix.

No layout, structural, or dependency changes needed. Single file edit.

