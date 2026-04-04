

## User-Defined Heatmap Metrics with Aggregation Support

### Problem

Currently, the heatmap auto-detects numeric fields from forms. This misses useful non-numeric data (e.g., showing a heatmap of how many partners carry brand "X") and doesn't let form creators control what's visualized or how values are aggregated.

### Design

Add a **"Heatmap Metrics"** configuration section to the form builder where the form creator defines named metrics. Each metric specifies:

- **Name** — display label (e.g., "Avg Competitor Price by Brand")
- **Value Field** — which field to measure (numeric fields for sum/avg/min/max; any field for count)
- **Aggregation** — how to reduce multiple submissions: `latest`, `sum`, `average`, `min`, `max`, `count`, `count_distinct`
- **Group-By Field** (optional) — pivot-style breakdown. When set, the heatmap selector will show sub-options for each unique value of that field (e.g., Brand → "CoolBrand", "IcePure", "FreshDrop")

#### Example: Competitor Price Check form

The form creator defines these metrics:
1. **"Competitor Price"** — Value: `Competitor Price`, Agg: `average`, Group-by: `Competitor Brand`
2. **"Our Price"** — Value: `Our Price`, Agg: `average`, Group-by: `Competitor Brand`  
3. **"Brand Count"** — Value: `Competitor Brand`, Agg: `count_distinct`, Group-by: none

On the map, when a user selects "Competitor Price Check" → "Competitor Price", a third dropdown appears listing the unique brand values ("CoolBrand", "IcePure", "FreshDrop", or "All"). Selecting "CoolBrand" shows the average competitor price for CoolBrand per partner location.

### UI in Form Builder

A new card below the Fields card titled **"Heatmap Metrics"** with:
- A list of defined metrics, each as a compact row with: Name input, Value Field dropdown, Aggregation dropdown, optional Group-By dropdown, delete button
- An "Add Metric" button
- Helper text: "Define which data from this form can be visualized on the map heatmap"

### UI on Map (MapFilterBar)

When "Market Data" is selected and a form is chosen:
- The **Field** dropdown is replaced with a **Metric** dropdown listing the form's defined heatmap metrics
- If the selected metric has a group-by field, a fourth **Group Value** dropdown appears listing the distinct values found in submissions, plus an "All (aggregated)" option

### Data Model Changes

**`src/types/market-data.ts`** — Add:
```text
HeatmapMetricDef {
  id: string
  name: string
  valueFieldId: string        // which field to aggregate
  aggregation: "latest" | "sum" | "average" | "min" | "max" | "count" | "count_distinct"
  groupByFieldId?: string     // optional pivot field
}

FormDefinition.heatmapMetrics?: HeatmapMetricDef[]
```

### Files Modified

1. **`src/types/market-data.ts`** — Add `HeatmapMetricDef` interface; add `heatmapMetrics` to `FormDefinition`
2. **`src/pages/mpromo/MPromoFormBuilder.tsx`** — Add "Heatmap Metrics" card with metric editor rows
3. **`src/lib/demo/market-data.ts`** — Add demo heatmap metrics to existing forms (e.g., Competitor Price Check gets brand-grouped metrics)
4. **`src/lib/api/market-data.ts`** — Replace `getFormHeatMetricOptions()` to return defined metrics instead of auto-detected fields; update `getFormDataForHeatmap()` to compute aggregations with optional group-by logic
5. **`src/components/mpromo/map/MapFilterBar.tsx`** — Replace Field dropdown with Metric dropdown; add conditional Group Value dropdown when metric has group-by; add new props for `heatMetricId` and `heatGroupValue`
6. **`src/pages/mpromo/MPromoMap.tsx`** — Add `heatMetricId` and `heatGroupValue` state; update composite metric key to include group value
7. **`src/components/mpromo/map/useMapHeatLayer.ts`** — Update `getMetricValue` and `getFormDataForHeatmap` calls to handle the new aggregation and group-by logic

### Metric Key Format

The composite key becomes: `form_metric:{formId}:{metricId}:{groupValue}` (or `form_metric:{formId}:{metricId}` when no group-by). This replaces the old `form_field:` pattern.

### Implementation Order

1. Types and demo data updates
2. Form builder — Heatmap Metrics editor
3. API layer — aggregation engine
4. MapFilterBar — metric + group value selectors
5. MPromoMap state management
6. useMapHeatLayer — consume new data format

