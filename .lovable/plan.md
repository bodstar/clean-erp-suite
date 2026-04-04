

## Market Data Collection — Form Builder for M-Promo

### Overview

Add a "Market Data" tab to M-Promo that lets admins build custom forms (with varying field types), collect submissions per partner (multiple submissions per form allowed), and visualize any numeric field on the map heatmap.

### Data Model (all client-side/demo for now)

```text
FormDefinition
  id, name, description, status (draft|active|archived),
  fields: FormField[], created_at, updated_at, team_id

FormField
  id, label, type (text|number|select|checkbox|date|textarea),
  required, options? (for select), order

FormSubmission
  id, form_id, partner_id, submitted_at, submitted_by,
  values: Record<fieldId, any>
```

### New Files

1. **`src/types/market-data.ts`** — Types for FormDefinition, FormField, FormSubmission
2. **`src/lib/demo/market-data.ts`** — Demo forms and submissions tied to existing partners
3. **`src/lib/api/market-data.ts`** — CRUD functions (getForms, getForm, createForm, updateForm, getSubmissions, createSubmission)
4. **`src/pages/mpromo/MPromoMarketData.tsx`** — Main page: list of forms with create/edit actions, click into a form to see submissions table
5. **`src/pages/mpromo/MPromoFormBuilder.tsx`** — Form builder page: add/remove/reorder fields with drag, set field types, preview
6. **`src/pages/mpromo/MPromoFormDetail.tsx`** — View submissions for a form in a dynamic table (columns derived from form fields), with ability to add new submission for a partner
7. **`src/components/mpromo/FormFieldEditor.tsx`** — Individual field config row (label, type selector, required toggle, options for select)
8. **`src/components/mpromo/FormSubmissionModal.tsx`** — Modal to fill out a form for a specific partner
9. **`src/components/mpromo/FormSubmissionsTable.tsx`** — Reusable dynamic table component that renders columns from form field definitions

### Modified Files

1. **`src/App.tsx`** — Add routes: `market-data`, `market-data/new`, `market-data/:id`, `market-data/:id/edit`
2. **`src/components/mpromo/MPromoLayout.tsx`** — Add "Market Data" tab with `ClipboardList` icon
3. **`src/pages/mpromo/MPromoPartnerDetail.tsx`** — Add a "Market Data" tab showing all submissions for that partner grouped by form, each in a collapsible section with a dynamic table
4. **`src/components/mpromo/map/MapFilterBar.tsx`** — Extend `HeatMetric` type to include `form_field:{formId}:{fieldId}` pattern; add a nested selector that lists forms and their numeric fields
5. **`src/components/mpromo/map/useMapHeatLayer.ts`** — Handle form-field metrics by looking up submission data for each partner and extracting the field value (latest or average)
6. **`src/types/mpromo.ts`** — Extend `MapPartner` to optionally carry `form_data?: Record<string, Record<string, number>>` (formId → fieldId → aggregated value)
7. **`src/lib/api/mpromo.ts`** — When a form-field heat metric is active, enrich MapPartner data with aggregated form submission values

### Key Design Decisions

- **Dynamic columns**: Since forms have varying fields, submission tables dynamically generate columns from the form definition. Partner name and submission date are always the first two columns.
- **Multiple submissions**: Displayed as rows in a table per form. On the partner detail page, forms are collapsible accordion sections showing that partner's submissions only.
- **Heatmap integration**: Only numeric fields from active forms appear in the heat metric dropdown. The metric key format `form_field:{formId}:{fieldId}` distinguishes them from built-in metrics. The system aggregates the latest submission value per partner for visualization.
- **Form builder UX**: Fields are added via a "+" button, each row has type selector, label input, required toggle, and delete. Select-type fields get an options editor. A live preview panel shows how the form will look.

### Implementation Order

1. Types and demo data
2. API layer
3. Market Data list page + routing + nav tab
4. Form builder (create/edit)
5. Form detail page with dynamic submissions table
6. Submission modal (fill form for a partner)
7. Partner detail page — Market Data tab
8. Heatmap integration (metric selector + data enrichment)

