/**
 * @module MarketDataAPI
 * REST API client for the Market Data collection system.
 * Provides CRUD operations for form definitions and submissions,
 * plus heatmap metric computation with aggregation and group-by support.
 */

import api from "@/lib/api";
import type { FormDefinition, FormSubmission, HeatmapMetricDef } from "@/types/market-data";

const BASE = "/api/mpromo/market-data";

/** Retrieve all form definitions */
export async function getForms(): Promise<FormDefinition[]> {
  try {
    const res = await api.get(`${BASE}/forms`);
    return res.data.data;
  } catch {
    return [];
  }
}

/** Retrieve a single form by ID */
export async function getForm(id: string): Promise<FormDefinition | null> {
  try {
    const res = await api.get(`${BASE}/forms/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

/** Create a new form definition */
export async function createForm(data: Omit<FormDefinition, "id" | "created_at" | "updated_at">): Promise<FormDefinition> {
  const res = await api.post(`${BASE}/forms`, data);
  return res.data;
}

/** Update an existing form definition */
export async function updateForm(id: string, data: Partial<Omit<FormDefinition, "id" | "created_at">>): Promise<FormDefinition | null> {
  try {
    const res = await api.put(`${BASE}/forms/${id}`, data);
    return res.data;
  } catch {
    return null;
  }
}

/** Delete a form and all its submissions */
export async function deleteForm(id: string): Promise<boolean> {
  try {
    await api.delete(`${BASE}/forms/${id}`);
    return true;
  } catch {
    return false;
  }
}

/** Retrieve submissions, optionally filtered by form and/or partner */
export async function getSubmissions(formId?: string, partnerId?: number): Promise<FormSubmission[]> {
  try {
    const params: Record<string, string | number> = {};
    if (formId) params.form_id = formId;
    if (partnerId) params.partner_id = partnerId;
    const res = await api.get(`${BASE}/submissions`, { params });
    return res.data.data;
  } catch {
    return [];
  }
}

/** Record a new form submission */
export async function createSubmission(data: Omit<FormSubmission, "id">): Promise<FormSubmission> {
  const res = await api.post(`${BASE}/submissions`, data);
  return res.data;
}

/**
 * Compute aggregated heatmap data for a specific metric definition.
 * Returns Map of partner ID → aggregated numeric value.
 */
export async function getFormMetricHeatmapData(
  formId: string,
  metricId: string,
  groupValue?: string
): Promise<Record<number, number>> {
  try {
    const params: Record<string, string> = { metric_id: metricId };
    if (groupValue) params.group_value = groupValue;
    const res = await api.get(`${BASE}/forms/${formId}/aggregate`, { params });
    // Backend returns Record<string, number>, convert keys to numbers
    const result: Record<number, number> = {};
    for (const [key, val] of Object.entries(res.data)) {
      const numKey = Number(key);
      if (!isNaN(numKey)) result[numKey] = val as number;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Get heatmap metric definitions from all active forms.
 * Used by the map filter bar to populate the form/metric selection dropdowns.
 */
export async function getFormHeatMetricOptions(): Promise<{ formId: string; formName: string; metrics: HeatmapMetricDef[] }[]> {
  const allForms = await getForms();
  const result: { formId: string; formName: string; metrics: HeatmapMetricDef[] }[] = [];
  for (const form of allForms) {
    if (form.status !== "active") continue;
    if (!form.heatmapMetrics || form.heatmapMetrics.length === 0) continue;
    result.push({ formId: form.id, formName: form.name, metrics: form.heatmapMetrics });
  }
  return result;
}

/**
 * Get unique group-by values for a specific metric from submissions.
 */
export async function getGroupByValues(formId: string, metricId: string): Promise<string[]> {
  const [allForms, subs] = await Promise.all([getForms(), getSubmissions(formId)]);
  const form = allForms.find((f) => f.id === formId);
  if (!form) return [];
  const metric = form.heatmapMetrics?.find((m) => m.id === metricId);
  if (!metric?.groupByFieldId) return [];

  const values = new Set<string>();
  for (const sub of subs) {
    const val = sub.values[metric.groupByFieldId];
    if (val !== undefined && val !== null && val !== "") {
      values.add(String(val));
    }
  }
  return Array.from(values).sort();
}

/**
 * Legacy function kept for backward compatibility.
 * @deprecated Use {@link getFormMetricHeatmapData} instead
 */
export function getFormDataForHeatmap(): Record<string, Record<string, Record<number, number>>> {
  return {};
}
