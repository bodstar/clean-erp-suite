/**
 * @module MarketDataTypes
 * Type definitions for the Market Data collection system.
 * Supports dynamic form building, field-level configuration,
 * form submissions, and user-defined heatmap metric aggregations.
 */

/** Supported input types for dynamic form fields */
export type FormFieldType = "text" | "number" | "select" | "checkbox" | "date" | "textarea";

/** Form lifecycle state */
export type FormStatus = "draft" | "active" | "archived";

/**
 * Aggregation function applied when computing heatmap metric values
 * from multiple submissions per partner.
 *
 * - `latest`        — value from the most recent submission
 * - `sum`           — total across all submissions
 * - `average`       — arithmetic mean
 * - `min` / `max`   — extremes
 * - `count`         — number of submissions
 * - `count_distinct` — number of unique values (useful for non-numeric fields)
 */
export type HeatmapAggregation = "latest" | "sum" | "average" | "min" | "max" | "count" | "count_distinct";

/** A single field definition within a form */
export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  /** Predefined choices (select type only) */
  options?: string[];
  /** Allow respondents to type a custom option not in the list */
  allowCustomOption?: boolean;
  /** Allow selecting multiple options simultaneously */
  allowMultiSelect?: boolean;
  /** Display order (1-based) */
  order: number;
}

/**
 * A named heatmap metric defined by the form creator.
 * Controls what data from this form appears in the map heatmap
 * and how multiple submissions are aggregated per partner.
 */
export interface HeatmapMetricDef {
  id: string;
  /** Display label shown in the map metric selector */
  name: string;
  /** Which form field to extract values from */
  valueFieldId: string;
  /** How to reduce multiple values per partner to a single number */
  aggregation: HeatmapAggregation;
  /**
   * Optional pivot field. When set, the heatmap UI shows a "Group Value"
   * dropdown with the distinct values of this field (e.g., brand names),
   * letting users filter the aggregation to a specific group.
   */
  groupByFieldId?: string;
}

/** A complete form definition including fields and heatmap configuration */
export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  status: FormStatus;
  fields: FormField[];
  /** User-defined metrics for map heatmap visualization */
  heatmapMetrics?: HeatmapMetricDef[];
  created_at: string;
  updated_at: string;
  team_id?: number;
  team_name?: string;
}

/** A single form submission recorded for a partner */
export interface FormSubmission {
  id: string;
  form_id: string;
  partner_id: number;
  partner_name: string;
  submitted_at: string;
  submitted_by: string;
  /** Field values keyed by field ID */
  values: Record<string, any>;
}
