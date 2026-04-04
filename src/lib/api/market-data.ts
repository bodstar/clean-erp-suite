import type { FormDefinition, FormSubmission, HeatmapMetricDef } from "@/types/market-data";
import { demoForms, demoSubmissions } from "@/lib/demo/market-data";

// In-memory stores (client-side demo)
let forms = [...demoForms];
let submissions = [...demoSubmissions];
let nextFormNum = 5;
let nextSubNum = 20;

export async function getForms(): Promise<FormDefinition[]> {
  return [...forms];
}

export async function getForm(id: string): Promise<FormDefinition | null> {
  return forms.find((f) => f.id === id) ?? null;
}

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

export async function updateForm(id: string, data: Partial<Omit<FormDefinition, "id" | "created_at">>): Promise<FormDefinition | null> {
  const idx = forms.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  forms[idx] = { ...forms[idx], ...data, updated_at: new Date().toISOString() };
  return forms[idx];
}

export async function deleteForm(id: string): Promise<boolean> {
  const before = forms.length;
  forms = forms.filter((f) => f.id !== id);
  submissions = submissions.filter((s) => s.form_id !== id);
  return forms.length < before;
}

export async function getSubmissions(formId?: string, partnerId?: number): Promise<FormSubmission[]> {
  let result = [...submissions];
  if (formId) result = result.filter((s) => s.form_id === formId);
  if (partnerId) result = result.filter((s) => s.partner_id === partnerId);
  return result.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export async function createSubmission(data: Omit<FormSubmission, "id">): Promise<FormSubmission> {
  const sub: FormSubmission = { ...data, id: `sub-${nextSubNum++}` };
  submissions.push(sub);
  return sub;
}

/** Get heatmap metric definitions from active forms */
export function getFormHeatMetricOptions(): { formId: string; formName: string; metrics: HeatmapMetricDef[] }[] {
  const result: { formId: string; formName: string; metrics: HeatmapMetricDef[] }[] = [];
  for (const form of forms) {
    if (form.status !== "active") continue;
    if (!form.heatmapMetrics || form.heatmapMetrics.length === 0) continue;
    result.push({ formId: form.id, formName: form.name, metrics: form.heatmapMetrics });
  }
  return result;
}

/** Get unique group-by values for a specific metric from submissions */
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

/** Compute aggregated heatmap data for a specific metric definition */
export function getFormMetricHeatmapData(
  formId: string,
  metricId: string,
  groupValue?: string // undefined = aggregate all, specific value = filter
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

// Keep legacy function for backward compat but it won't be used in new flow
export function getFormDataForHeatmap(): Record<string, Record<string, Record<number, number>>> {
  return {};
}
