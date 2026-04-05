

## Code Documentation Plan

### Overview

Add JSDoc comments and module-level documentation across all custom source files built during this project. This covers types, hooks, API layers, components, pages, and utilities — approximately 25 files.

### What Gets Documented

**1. Type definitions** (3 files)
- `src/types/mpromo.ts` — Module header + JSDoc on each interface and type alias (Partner, Campaign, PromoCode, MapPartner, etc.)
- `src/types/market-data.ts` — Module header + JSDoc on FormField, FormDefinition, FormSubmission, HeatmapMetricDef, HeatmapAggregation
- `src/types/area-zone.ts` — Module header + JSDoc on AreaZone, ShapeMode, PolygonEndMode, ZONE_COLORS/ZONE_LABELS

**2. API and data layers** (4 files)
- `src/lib/api/market-data.ts` — Module header explaining in-memory demo store; JSDoc on every exported function (getForms, createForm, getFormHeatMetricOptions, getGroupByValues, getFormMetricHeatmapData, etc.) with `@param` and `@returns`
- `src/lib/api/mpromo.ts` — Same treatment for partner/campaign/code/order APIs
- `src/lib/api/mpromo-scope.ts` — Scope filtering logic documentation
- `src/lib/demo/market-data.ts` — Module header explaining demo seed data purpose; inline comments on each demo form and submission set

**3. Hooks** (2 files)
- `src/hooks/useAdvancedAreaSelection.ts` — Module header describing the advanced multi-zone selection system; JSDoc on the hook, helper functions (pointInPolygon, computePartnersInZone), and key callbacks (addZone, removeZone, setShapeMode, polygon drawing logic, drag-edit vertex add/remove)
- `src/components/mpromo/map/useMapHeatLayer.ts` — Module header; JSDoc on getHeatColor, getMetricValue, getMetricLabel, the main hook, and the smooth canvas renderer

**4. Map components** (3 files)
- `src/components/mpromo/map/MapFilterBar.tsx` — Module header; JSDoc on props interface explaining each filter/control
- `src/components/mpromo/map/MapPartnerPanel.tsx` — Module header; JSDoc on props and key rendering sections (single partner view, area selection list, advanced zones with export)
- `src/components/mpromo/map/AdvancedAreaPanel.tsx` — Module header; JSDoc on props and zone management UI

**5. Market Data components** (4 files)
- `src/components/mpromo/FormFieldEditor.tsx` — JSDoc on component and props
- `src/components/mpromo/FormSubmissionModal.tsx` — JSDoc on component explaining dynamic form rendering from FormDefinition
- `src/components/mpromo/FormSubmissionsTable.tsx` — JSDoc on component and formatValue helper
- `src/components/mpromo/HeatmapMetricsEditor.tsx` — JSDoc on component, aggregationLabels, and the field-type-aware aggregation logic

**6. Pages** (5 files)
- `src/pages/mpromo/MPromoMap.tsx` — Module header describing the main map page; document state management, marker icons, filtering logic, and integration points (heatmap, area selection, advanced selection)
- `src/pages/mpromo/MPromoMarketData.tsx` — Module header; document CRUD list page
- `src/pages/mpromo/MPromoFormBuilder.tsx` — Module header; document create/edit form builder with field editor and heatmap metrics editor
- `src/pages/mpromo/MPromoFormDetail.tsx` — Module header; document form detail with submissions table and submission modal
- `src/pages/mpromo/MPromoPartnerDetail.tsx` — JSDoc on Market Data tab integration

**7. Utilities** (2 files)
- `src/lib/export-zone-partners.ts` — Module header; JSDoc on CSV/Excel/PDF export functions
- `src/lib/demo/mpromo-data.ts` — Module header explaining demo data purpose

### Documentation Style

- **Module headers**: `/** @module ModuleName \n * Description */` at top of each file
- **Functions/components**: JSDoc with `@param`, `@returns`, `@example` where helpful
- **Interfaces**: JSDoc on the interface and non-obvious fields
- **Inline comments**: Only for complex logic (aggregation engine, polygon ray-casting, canvas rendering)
- No redundant comments on self-explanatory code

### Implementation Order

1. Types (foundation — referenced by everything)
2. API and demo data layers
3. Hooks (useAdvancedAreaSelection, useMapHeatLayer)
4. Components (FormFieldEditor, HeatmapMetricsEditor, FormSubmissionModal, FormSubmissionsTable, MapFilterBar, MapPartnerPanel, AdvancedAreaPanel)
5. Pages (MPromoMap, MPromoMarketData, MPromoFormBuilder, MPromoFormDetail, MPromoPartnerDetail)
6. Utilities (export-zone-partners)

