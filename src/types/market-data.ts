export type FormFieldType = "text" | "number" | "select" | "checkbox" | "date" | "textarea";
export type FormStatus = "draft" | "active" | "archived";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[]; // for select type
  allowCustomOption?: boolean; // for select: respondents can add their own option
  allowMultiSelect?: boolean; // for select: allow multiple selections
  order: number;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  status: FormStatus;
  fields: FormField[];
  created_at: string;
  updated_at: string;
  team_id?: number;
  team_name?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  partner_id: number;
  partner_name: string;
  submitted_at: string;
  submitted_by: string;
  values: Record<string, any>;
}
