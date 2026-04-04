import { subDays, format } from "date-fns";
import type { FormDefinition, FormSubmission } from "@/types/market-data";

const now = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd HH:mm");

export const demoForms: FormDefinition[] = [
  {
    id: "form-1",
    name: "Weekly Stock Check",
    description: "Captures current inventory levels and product availability at partner locations",
    status: "active",
    fields: [
      { id: "f1-1", label: "Cases in Stock", type: "number", required: true, order: 1 },
      { id: "f1-2", label: "Empty Bottles Returned", type: "number", required: true, order: 2 },
      { id: "f1-3", label: "Stock Condition", type: "select", required: true, options: ["Good", "Fair", "Poor"], order: 3 },
      { id: "f1-4", label: "Notes", type: "textarea", required: false, order: 4 },
    ],
    heatmapMetrics: [
      { id: "hm-1-1", name: "Cases in Stock (Latest)", valueFieldId: "f1-1", aggregation: "latest" },
      { id: "hm-1-2", name: "Total Bottles Returned", valueFieldId: "f1-2", aggregation: "sum" },
      { id: "hm-1-3", name: "Avg Cases in Stock", valueFieldId: "f1-1", aggregation: "average" },
    ],
    created_at: fmt(subDays(now, 30)),
    updated_at: fmt(subDays(now, 2)),
    team_id: 1,
    team_name: "Magvlyn HQ",
  },
  {
    id: "form-2",
    name: "Customer Satisfaction Survey",
    description: "Monthly survey measuring partner satisfaction and feedback",
    status: "active",
    fields: [
      { id: "f2-1", label: "Overall Rating", type: "number", required: true, order: 1 },
      { id: "f2-2", label: "Delivery Timeliness", type: "select", required: true, options: ["On Time", "1-2 Days Late", "3+ Days Late"], order: 2 },
      { id: "f2-3", label: "Would Recommend", type: "checkbox", required: false, order: 3 },
      { id: "f2-4", label: "Feedback", type: "textarea", required: false, order: 4 },
    ],
    heatmapMetrics: [
      { id: "hm-2-1", name: "Avg Rating", valueFieldId: "f2-1", aggregation: "average" },
      { id: "hm-2-2", name: "Survey Count", valueFieldId: "f2-1", aggregation: "count" },
    ],
    created_at: fmt(subDays(now, 60)),
    updated_at: fmt(subDays(now, 5)),
    team_id: 1,
    team_name: "Magvlyn HQ",
  },
  {
    id: "form-3",
    name: "Competitor Price Check",
    description: "Track competitor pricing in the area around each partner",
    status: "active",
    fields: [
      { id: "f3-1", label: "Competitor Brand", type: "text", required: true, order: 1 },
      { id: "f3-2", label: "Competitor Price (GH₵)", type: "number", required: true, order: 2 },
      { id: "f3-3", label: "Our Price (GH₵)", type: "number", required: true, order: 3 },
      { id: "f3-4", label: "Date Observed", type: "date", required: true, order: 4 },
      { id: "f3-5", label: "Location Detail", type: "text", required: false, order: 5 },
    ],
    heatmapMetrics: [
      { id: "hm-3-1", name: "Avg Competitor Price", valueFieldId: "f3-2", aggregation: "average", groupByFieldId: "f3-1" },
      { id: "hm-3-2", name: "Avg Our Price", valueFieldId: "f3-3", aggregation: "average", groupByFieldId: "f3-1" },
      { id: "hm-3-3", name: "Brand Count", valueFieldId: "f3-1", aggregation: "count_distinct" },
    ],
    created_at: fmt(subDays(now, 15)),
    updated_at: fmt(subDays(now, 1)),
    team_id: 2,
    team_name: "Franchise – Accra Central",
  },
  {
    id: "form-4",
    name: "Equipment Condition Report",
    description: "Quarterly assessment of chiller/equipment condition at partner sites",
    status: "draft",
    fields: [
      { id: "f4-1", label: "Equipment Working", type: "checkbox", required: true, order: 1 },
      { id: "f4-2", label: "Temperature Reading", type: "number", required: true, order: 2 },
      { id: "f4-3", label: "Cleanliness", type: "select", required: true, options: ["Excellent", "Good", "Needs Cleaning", "Dirty"], order: 3 },
      { id: "f4-4", label: "Maintenance Needed", type: "textarea", required: false, order: 4 },
    ],
    created_at: fmt(subDays(now, 3)),
    updated_at: fmt(subDays(now, 3)),
    team_id: 1,
    team_name: "Magvlyn HQ",
  },
];

export const demoSubmissions: FormSubmission[] = [
  // Weekly Stock Check submissions
  { id: "sub-1", form_id: "form-1", partner_id: 1, partner_name: "Kwame Asante Chiller Hub", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent A", values: { "f1-1": 24, "f1-2": 12, "f1-3": "Good", "f1-4": "" } },
  { id: "sub-2", form_id: "form-1", partner_id: 3, partner_name: "Akosua Cold Drinks", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent A", values: { "f1-1": 18, "f1-2": 8, "f1-3": "Fair", "f1-4": "Some bottles damaged" } },
  { id: "sub-3", form_id: "form-1", partner_id: 6, partner_name: "Abena Ice Point", submitted_at: fmt(subDays(now, 2)), submitted_by: "Field Agent B", values: { "f1-1": 32, "f1-2": 20, "f1-3": "Good", "f1-4": "" } },
  { id: "sub-4", form_id: "form-1", partner_id: 8, partner_name: "Nana Cooler Station", submitted_at: fmt(subDays(now, 2)), submitted_by: "Field Agent A", values: { "f1-1": 45, "f1-2": 15, "f1-3": "Good", "f1-4": "Highest stock in the area" } },
  { id: "sub-5", form_id: "form-1", partner_id: 1, partner_name: "Kwame Asante Chiller Hub", submitted_at: fmt(subDays(now, 8)), submitted_by: "Field Agent A", values: { "f1-1": 20, "f1-2": 10, "f1-3": "Good", "f1-4": "" } },
  { id: "sub-6", form_id: "form-1", partner_id: 10, partner_name: "Kojo Refresh Corner", submitted_at: fmt(subDays(now, 3)), submitted_by: "Field Agent B", values: { "f1-1": 15, "f1-2": 5, "f1-3": "Poor", "f1-4": "Chiller door not closing" } },
  { id: "sub-7", form_id: "form-1", partner_id: 12, partner_name: "Kwesi Drinks Depot", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent C", values: { "f1-1": 28, "f1-2": 14, "f1-3": "Good", "f1-4": "" } },
  // Customer Satisfaction Survey submissions
  { id: "sub-8", form_id: "form-2", partner_id: 1, partner_name: "Kwame Asante Chiller Hub", submitted_at: fmt(subDays(now, 5)), submitted_by: "Field Agent A", values: { "f2-1": 9, "f2-2": "On Time", "f2-3": true, "f2-4": "Very satisfied with service" } },
  { id: "sub-9", form_id: "form-2", partner_id: 2, partner_name: "Amina Ice Water Express", submitted_at: fmt(subDays(now, 5)), submitted_by: "Field Agent B", values: { "f2-1": 7, "f2-2": "1-2 Days Late", "f2-3": true, "f2-4": "" } },
  { id: "sub-10", form_id: "form-2", partner_id: 4, partner_name: "Efua Pure Water", submitted_at: fmt(subDays(now, 6)), submitted_by: "Field Agent A", values: { "f2-1": 5, "f2-2": "3+ Days Late", "f2-3": false, "f2-4": "Delivery delays are a major issue" } },
  { id: "sub-11", form_id: "form-2", partner_id: 8, partner_name: "Nana Cooler Station", submitted_at: fmt(subDays(now, 4)), submitted_by: "Field Agent C", values: { "f2-1": 10, "f2-2": "On Time", "f2-3": true, "f2-4": "Best partner experience" } },
  // Competitor Price Check submissions
  { id: "sub-12", form_id: "form-3", partner_id: 2, partner_name: "Amina Ice Water Express", submitted_at: fmt(subDays(now, 3)), submitted_by: "Field Agent B", values: { "f3-1": "CoolBrand", "f3-2": 3.5, "f3-3": 3.0, "f3-4": fmt(subDays(now, 3)).slice(0, 10), "f3-5": "Madina Market" } },
  { id: "sub-13", form_id: "form-3", partner_id: 4, partner_name: "Efua Pure Water", submitted_at: fmt(subDays(now, 2)), submitted_by: "Field Agent A", values: { "f3-1": "IcePure", "f3-2": 4.0, "f3-3": 3.5, "f3-4": fmt(subDays(now, 2)).slice(0, 10), "f3-5": "East Legon junction" } },
  { id: "sub-14", form_id: "form-3", partner_id: 12, partner_name: "Kwesi Drinks Depot", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent C", values: { "f3-1": "FreshDrop", "f3-2": 3.0, "f3-3": 2.8, "f3-4": fmt(subDays(now, 1)).slice(0, 10), "f3-5": "Spintex Road" } },
  { id: "sub-15", form_id: "form-3", partner_id: 2, partner_name: "Amina Ice Water Express", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent B", values: { "f3-1": "IcePure", "f3-2": 3.8, "f3-3": 3.2, "f3-4": fmt(subDays(now, 1)).slice(0, 10), "f3-5": "Madina Market" } },
  { id: "sub-16", form_id: "form-3", partner_id: 4, partner_name: "Efua Pure Water", submitted_at: fmt(subDays(now, 1)), submitted_by: "Field Agent A", values: { "f3-1": "CoolBrand", "f3-2": 4.2, "f3-3": 3.6, "f3-4": fmt(subDays(now, 1)).slice(0, 10), "f3-5": "East Legon junction" } },
];
