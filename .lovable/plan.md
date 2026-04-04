

## Separate Form-Based Heatmap Metrics into a Two-Step Selection Flow

### What Changes

Currently, the heatmap Metric dropdown mixes built-in metrics (Redemptions, Orders, etc.) with form field metrics in grouped sections. This will be replaced with a cleaner two-step flow:

1. **Metric dropdown** — shows only built-in metrics plus a new "Market Data" option
2. When "Market Data" is selected, two additional dropdowns appear:
   - **Form** — select which form to interrogate
   - **Field** — select which numeric field from that form to visualize

### How It Works

**MapFilterBar.tsx**:
- Remove the form field `SelectGroup` entries from the main Metric dropdown
- Add a single `"market_data"` option at the bottom of the Metric select
- When `heatMetric === "market_data"`, render two new dropdowns:
  - **Form selector**: lists active forms (fetched via `getFormHeatMetricOptions()` grouped by form)
  - **Field selector**: lists numeric fields of the selected form
- Selecting a form + field sets the actual metric to `form_field:{formId}:{fieldId}` internally
- Add two new state props: `heatFormId` / `onHeatFormIdChange` and `heatFieldId` / `onHeatFieldIdChange`

**MPromoMap.tsx**:
- Add `heatFormId` and `heatFieldId` state
- When form or field changes, compute the composite `heatMetric` value (`form_field:{formId}:{fieldId}`)
- Pass these to MapFilterBar

**useMapHeatLayer.ts** — no changes needed, it already handles the `form_field:` prefix format.

### Technical Details

- The `HeatMetric` type stays as `string` — it continues to support both built-in keys and the `form_field:*` pattern
- The "Market Data" selection acts as a mode switch in the UI; the actual metric passed to the heat layer is still the composite key
- When user picks "Market Data" but hasn't selected a form+field yet, no heatmap renders (metric stays `"market_data"` which produces 0 values)
- Switching away from "Market Data" back to a built-in metric clears the form/field selectors

### Files Modified

1. **`src/components/mpromo/map/MapFilterBar.tsx`** — restructure metric dropdown, add form + field selectors
2. **`src/pages/mpromo/MPromoMap.tsx`** — add form/field state, derive composite metric

