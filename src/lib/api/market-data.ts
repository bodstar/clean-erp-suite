/**
 * @module MarketDataAPI
 * In-memory demo API for the Market Data collection system.
 * Provides CRUD operations for form definitions and submissions,
 * plus heatmap metric computation with aggregation and group-by support.
 *
 * In production, these functions would call a REST API. In demo mode,
 * data is stored in module-scoped arrays seeded from `demo/market-data.ts`.
 */

import type { FormDefinition, FormSubmission, HeatmapMetricDef } from "@/types/market-data";
import { demoForms, demoSubmissions } from "@/lib/demo/market-data";

// In-memory stores (client-side demo)
let forms = [...demoForms];
let submissions = [...demoSubmissions];
let nextFormNum = 5;
let nextSubNum = 20;

/** Retrieve all form definitions */
export async function getForms(): Promise<FormDefinition[]> {
  return [...forms];
}

/**
 * Retrieve a single form by ID
 * @returns The form or null if not found
 */
export async function getForm(id: string): Promise<FormDefinition | null> {
  return forms.find((f) => f.id === id) ?? null;
}

/**
 * Create a new form definition
 * @param data - Form data without auto-generated fields (id, timestamps)
 * @returns The created form with generated ID and timestamps
 */
export async function createForm(data: Omit<FormDefinition, "id" | "created_at" | "updated_at">): Promise<FormDefinition> {
  const now = new Date().toISOString();
  const form: FormDefinition = {
    ...data,
    id: `form-${nextFormNum++}`,
    created_at: now,
    updated_at: now,
  };
  forms.push(form);
  return form;
}

/**
 * Update an existing form definition
 * @param id - Form ID to update
 * @param data - Partial form data to merge
 * @returns Updated form or null if not found
 */
export async function updateForm(id: string, data: Partial<Omit<FormDefinition, "id" | "created_at">>): Promise<FormDefinition | null> {
  const idx = forms.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  forms[idx] = { ...forms[idx], ...data, updated_at: new Date().toISOString() };
  return forms[idx];
}

/**
 * Delete a form and all its submissions
 * @returns true if the form was found and deleted
 */
export async function deleteForm(id: string): Promise<boolean> {
  const before = forms.length;
  forms = forms.filter((f) => f.id !== id);
  submissions = submissions.filter((s) => s.form_id !== id);
  return forms.length < before;
}

/**
 * Retrieve submissions, optionally filtered by form and/or partner
 * @param formId - Filter by form ID
 * @param partnerId - Filter by partner ID
 * @returns Submissions sorted by date descending
 */
export async function getSubmissions(formId?: string, partnerId?: number): Promise<FormSubmission[]> {
  let result = [...submissions];
  if (formId) result = result.filter((s) => s.form_id === formId);
  if (partnerId) result = result.filter((s) => s.partner_id === partnerId);
  return result.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

/**
 * Record a new form submission
 * @param data - Submission data without auto-generated ID
 */
export async function createSubmission(data: Omit<FormSubmission, "id">): Promise<FormSubmission> {
  const sub: FormSubmission = { ...data, id: `sub-${nextSubNum++}` };
  submissions.push(sub);
  return sub;
}

/**
 * Get heatmap metric definitions from all active forms.
 * Used by the map filter bar to populate the form/metric selection dropdowns.
 * @returns Array of forms with their defined heatmap metrics
 */
export function getFormHeatMetricOptions(): { formId: string; formName: string; metrics: HeatmapMetricDef[] }[] {
  const result: { formId: string; formName: string; metrics: HeatmapMetricDef[] }[] = [];
  for (const form of forms) {
    if (form.status !== "active") continue;
    if (!form.heatmapMetrics || form.heatmapMetrics.length === 0) continue;
    result.push({ formId: form.id, formName: form.name, metrics: form.heatmapMetrics });
  }
  return result;
}

/**
 * Get unique group-by values for a specific metric from submissions.
 * For example, if the metric groups by "Competitor Brand", this returns
 * all distinct brand names found across submissions.
 *
 * @param formId - The form containing the metric
 * @param metricId - The metric definition ID
 * @returns Sorted array of unique string values
 */
export function getGroupByValues(formId: string, metricId: string): string[] {
  const form = forms.find((f) => f.id === formId);
  if (!form) return [];
  const metric = form.heatmapMetrics?.find((m) => m.id === metricId);
  if (!metric?.groupByFieldId) return [];

  const values = new Set<string>();
  for (const sub of submissions) {
    if (sub.form_id !== formId) continue;
    const val = sub.values[metric.groupByFieldId];
    if (val !== undefined && val !== null && val !== "") {
      values.add(String(val));
    }
  }
  return Array.from(values).sort();
}

/**
 * Compute aggregated heatmap data for a specific metric definition.
 * Groups submissions by partner, applies the metric's aggregation function,
 * and optionally filters by a group-by value.
 *
 * @param formId - The form containing the metric
 * @param metricId - The metric definition ID
 * @param groupValue - Optional filter: a specific group-by value, or "__all__" for all
 * @returns Map of partner ID → aggregated numeric value
 *
 * @example
 * // Get average competitor price for "CoolBrand" per partner
 * const data = getFormMetricHeatmapData("form-3", "hm-3-1", "CoolBrand");
 * // { 2: 3.5, 4: 4.2 }
 */
export function getFormMetricHeatmapData(
  formId: string,
  metricId: string,
  groupValue?: string
): Record<number, number> {
  const form = forms.find((f) => f.id === formId);
  if (!form) return {};
  const metric = form.heatmapMetrics?.find((m) => m.id === metricId);
  if (!metric) return {};

  // Get relevant submissions
  let formSubs = submissions.filter((s) => s.form_id === formId);

  // If group-by and a specific value is selected, filter
  if (metric.groupByFieldId && groupValue && groupValue !== "__all__") {
    formSubs = formSubs.filter((s) => String(s.values[metric.groupByFieldId!]) === groupValue);
  }

  // Group by partner
  const byPartner = new Map<number, FormSubmission[]>();
  for (const sub of formSubs) {
    if (!byPartner.has(sub.partner_id)) byPartner.set(sub.partner_id, []);
    byPartner.get(sub.partner_id)!.push(sub);
  }

  const result: Record<number, number> = {};

  for (const [partnerId, subs] of byPartner) {
    const sorted = [...subs].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

    switch (metric.aggregation) {
      case "latest": {
        const val = Number(sorted[0]?.values[metric.valueFieldId]);
        if (!isNaN(val)) result[partnerId] = val;
        break;
      }
      case "sum": {
        let total = 0;
        for (const s of sorted) {
          const v = Number(s.values[metric.valueFieldId]);
          if (!isNaN(v)) total += v;
        }
        result[partnerId] = total;
        break;
      }
      case "average": {
        let total = 0, count = 0;
        for (const s of sorted) {
          const v = Number(s.values[metric.valueFieldId]);
          if (!isNaN(v)) { total += v; count++; }
        }
        if (count > 0) result[partnerId] = total / count;
        break;
      }
      case "min": {
        let min = Infinity;
        for (const s of sorted) {
          const v = Number(s.values[metric.valueFieldId]);
          if (!isNaN(v) && v < min) min = v;
        }
        if (min !== Infinity) result[partnerId] = min;
        break;
      }
      case "max": {
        let max = -Infinity;
        for (const s of sorted) {
          const v = Number(s.values[metric.valueFieldId]);
          if (!isNaN(v) && v > max) max = v;
        }
        if (max !== -Infinity) result[partnerId] = max;
        break;
      }
      case "count": {
        result[partnerId] = sorted.length;
        break;
      }
      case "count_distinct": {
        const unique = new Set<string>();
        for (const s of sorted) {
          const v = s.values[metric.valueFieldId];
          if (v !== undefined && v !== null && v !== "") unique.add(String(v));
        }
        result[partnerId] = unique.size;
        break;
      }
    }
  }

  return result;
}

/**
 * Legacy function kept for backward compatibility.
 * No longer used in the new form-metric-based heatmap flow.
 * @deprecated Use {@link getFormMetricHeatmapData} instead
 */
export function getFormDataForHeatmap(): Record<string, Record<string, Record<number, number>>> {
  return {};
}
