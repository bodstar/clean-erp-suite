import type { FormDefinition, FormSubmission, FormField } from "@/types/market-data";
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

/** Get aggregated form data for map heatmap: formId → fieldId → partnerId → latest numeric value */
export function getFormDataForHeatmap(): Record<string, Record<string, Record<number, number>>> {
  const result: Record<string, Record<string, Record<number, number>>> = {};

  // Group submissions by form_id, then by partner_id, take latest
  const byFormPartner = new Map<string, Map<number, FormSubmission>>();
  for (const sub of submissions) {
    if (!byFormPartner.has(sub.form_id)) byFormPartner.set(sub.form_id, new Map());
    const partnerMap = byFormPartner.get(sub.form_id)!;
    const existing = partnerMap.get(sub.partner_id);
    if (!existing || sub.submitted_at > existing.submitted_at) {
      partnerMap.set(sub.partner_id, sub);
    }
  }

  for (const form of forms) {
    if (form.status !== "active") continue;
    const numericFields = form.fields.filter((f) => f.type === "number");
    if (numericFields.length === 0) continue;

    result[form.id] = {};
    for (const field of numericFields) {
      result[form.id][field.id] = {};
      const partnerMap = byFormPartner.get(form.id);
      if (partnerMap) {
        for (const [partnerId, sub] of partnerMap) {
          const val = Number(sub.values[field.id]);
          if (!isNaN(val)) {
            result[form.id][field.id][partnerId] = val;
          }
        }
      }
    }
  }

  return result;
}

/** Get numeric fields from active forms for the heatmap metric selector */
export function getFormHeatMetricOptions(): { formId: string; formName: string; fieldId: string; fieldLabel: string }[] {
  const options: { formId: string; formName: string; fieldId: string; fieldLabel: string }[] = [];
  for (const form of forms) {
    if (form.status !== "active") continue;
    for (const field of form.fields) {
      if (field.type === "number") {
        options.push({ formId: form.id, formName: form.name, fieldId: field.id, fieldLabel: field.label });
      }
    }
  }
  return options;
}
