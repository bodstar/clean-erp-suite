import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField, HeatmapMetricDef, HeatmapAggregation } from "@/types/market-data";

interface HeatmapMetricsEditorProps {
  fields: FormField[];
  metrics: HeatmapMetricDef[];
  onChange: (metrics: HeatmapMetricDef[]) => void;
}

const aggregationLabels: Record<HeatmapAggregation, string> = {
  latest: "Latest",
  sum: "Sum",
  average: "Average",
  min: "Min",
  max: "Max",
  count: "Count",
  count_distinct: "Count Distinct",
};

// count and count_distinct work on any field type; others need numeric
const numericOnlyAggs: HeatmapAggregation[] = ["latest", "sum", "average", "min", "max"];

export function HeatmapMetricsEditor({ fields, metrics, onChange }: HeatmapMetricsEditorProps) {
  const addMetric = () => {
    const newMetric: HeatmapMetricDef = {
      id: `hm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      valueFieldId: "",
      aggregation: "latest",
    };
    onChange([...metrics, newMetric]);
  };

  const updateMetric = (index: number, partial: Partial<HeatmapMetricDef>) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const removeMetric = (index: number) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  const getAvailableAggregations = (valueFieldId: string): HeatmapAggregation[] => {
    const field = fields.find((f) => f.id === valueFieldId);
    if (!field) return Object.keys(aggregationLabels) as HeatmapAggregation[];
    if (field.type === "number") return Object.keys(aggregationLabels) as HeatmapAggregation[];
    // Non-numeric: only count and count_distinct
    return ["count", "count_distinct"];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Heatmap Metrics</CardTitle>
        <p className="text-xs text-muted-foreground">
          Define which data from this form can be visualized on the map heatmap
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric, i) => {
          const availableAggs = getAvailableAggregations(metric.valueFieldId);
          // If current aggregation is invalid for field, reset it
          const currentAggValid = availableAggs.includes(metric.aggregation);

          return (
            <div key={metric.id} className="flex flex-wrap items-end gap-2 p-3 border rounded-lg bg-card">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Name</Label>
                <Input
                  value={metric.name}
                  onChange={(e) => updateMetric(i, { name: e.target.value })}
                  placeholder="e.g. Avg Price by Brand"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1 w-44">
                <Label className="text-xs">Value Field</Label>
                <Select
                  value={metric.valueFieldId}
                  onValueChange={(v) => {
                    const field = fields.find((f) => f.id === v);
                    const newAggs = field?.type === "number"
                      ? (Object.keys(aggregationLabels) as HeatmapAggregation[])
                      : (["count", "count_distinct"] as HeatmapAggregation[]);
                    const aggValid = newAggs.includes(metric.aggregation);
                    updateMetric(i, {
                      valueFieldId: v,
                      aggregation: aggValid ? metric.aggregation : newAggs[0],
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select field…" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label || "Untitled"} ({f.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-36">
                <Label className="text-xs">Aggregation</Label>
                <Select
                  value={currentAggValid ? metric.aggregation : availableAggs[0]}
                  onValueChange={(v) => updateMetric(i, { aggregation: v as HeatmapAggregation })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAggs.map((agg) => (
                      <SelectItem key={agg} value={agg}>
                        {aggregationLabels[agg]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-44">
                <Label className="text-xs">Group By (optional)</Label>
                <Select
                  value={metric.groupByFieldId ?? "__none__"}
                  onValueChange={(v) => updateMetric(i, { groupByFieldId: v === "__none__" ? undefined : v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {fields
                      .filter((f) => f.id !== metric.valueFieldId)
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label || "Untitled"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeMetric(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <Button variant="outline" onClick={addMetric} className="w-full gap-1.5">
          <Plus className="h-4 w-4" /> Add Metric
        </Button>
      </CardContent>
    </Card>
  );
}
