import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SquareDashedMousePointer, Shapes } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFormHeatMetricOptions, getGroupByValues } from "@/lib/api/market-data";
import type { HeatmapMetricDef } from "@/types/market-data";

export type HeatMetric = string;
export type HeatStyle = "circles" | "smooth";

interface MapFilterBarProps {
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  heatmap: boolean;
  onHeatmapChange: (value: boolean) => void;
  heatMetric: HeatMetric;
  onHeatMetricChange: (value: HeatMetric) => void;
  heatStyle: HeatStyle;
  onHeatStyleChange: (value: HeatStyle) => void;
  heatRadius: number;
  onHeatRadiusChange: (value: number) => void;
  heatBlur: number;
  onHeatBlurChange: (value: number) => void;
  heatOpacity: number;
  onHeatOpacityChange: (value: number) => void;
  isLoading: boolean;
  areaSelect?: boolean;
  onAreaSelectChange?: (value: boolean) => void;
  showMarkers?: boolean;
  onShowMarkersChange?: (value: boolean) => void;
  advancedAreaSelect?: boolean;
  onAdvancedAreaSelectChange?: (value: boolean) => void;
  heatFormId: string;
  onHeatFormIdChange: (value: string) => void;
  heatMetricId: string;
  onHeatMetricIdChange: (value: string) => void;
  heatGroupValue: string;
  onHeatGroupValueChange: (value: string) => void;
}

export function MapFilterBar({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  heatmap,
  onHeatmapChange,
  heatMetric,
  onHeatMetricChange,
  heatStyle,
  onHeatStyleChange,
  heatRadius,
  onHeatRadiusChange,
  heatBlur,
  onHeatBlurChange,
  heatOpacity,
  onHeatOpacityChange,
  isLoading,
  areaSelect,
  onAreaSelectChange,
  showMarkers,
  onShowMarkersChange,
  advancedAreaSelect,
  onAdvancedAreaSelectChange,
  heatFormId,
  onHeatFormIdChange,
  heatMetricId,
  onHeatMetricIdChange,
  heatGroupValue,
  onHeatGroupValueChange,
}: MapFilterBarProps) {
  const [formOptions, setFormOptions] = useState<{ formId: string; formName: string; metrics: HeatmapMetricDef[] }[]>([]);
  const [groupValues, setGroupValues] = useState<string[]>([]);

  useEffect(() => {
    setFormOptions(getFormHeatMetricOptions());
  }, []);

  // Load group values when metric changes
  useEffect(() => {
    if (heatFormId && heatMetricId) {
      const vals = getGroupByValues(heatFormId, heatMetricId);
      setGroupValues(vals);
    } else {
      setGroupValues([]);
    }
  }, [heatFormId, heatMetricId]);

  const isMarketDataMode = heatMetric === "market_data" || heatMetric.startsWith("form_metric:");
  const selectedForm = formOptions.find((f) => f.formId === heatFormId);
  const selectedMetricDef = selectedForm?.metrics.find((m) => m.id === heatMetricId);
  const hasGroupBy = !!selectedMetricDef?.groupByFieldId;

  const metricCategory = heatMetric.startsWith("form_metric:") ? "market_data" : heatMetric;

  const handleMetricCategoryChange = (value: string) => {
    if (value === "market_data") {
      onHeatMetricChange("market_data");
    } else {
      onHeatMetricChange(value);
      onHeatFormIdChange("");
      onHeatMetricIdChange("");
      onHeatGroupValueChange("");
    }
  };

  const handleFormChange = (formId: string) => {
    onHeatFormIdChange(formId);
    onHeatMetricIdChange("");
    onHeatGroupValueChange("");
    onHeatMetricChange("market_data");
  };

  const handleMetricIdChange = (metricId: string) => {
    onHeatMetricIdChange(metricId);
    onHeatGroupValueChange("");
    if (heatFormId && metricId) {
      // Check if this metric has group-by; if not, set the composite key now
      const form = formOptions.find((f) => f.formId === heatFormId);
      const metric = form?.metrics.find((m) => m.id === metricId);
      if (metric && !metric.groupByFieldId) {
        onHeatMetricChange(`form_metric:${heatFormId}:${metricId}`);
      } else {
        onHeatMetricChange("market_data"); // wait for group value
      }
    }
  };

  const handleGroupValueChange = (value: string) => {
    onHeatGroupValueChange(value);
    if (heatFormId && heatMetricId) {
      onHeatMetricChange(`form_metric:${heatFormId}:${heatMetricId}:${value}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Partner Type</Label>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CHILLER">Chillers</SelectItem>
            <SelectItem value="ICE_WATER_SELLER">Ice Water Sellers</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Search</Label>
        <Input
          className="w-48 h-8 text-xs"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name / Phone / Location"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="heatmap" checked={heatmap} onCheckedChange={onHeatmapChange} />
        <Label htmlFor="heatmap" className="text-xs">
          Heatmap
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="show-markers" checked={showMarkers ?? true} onCheckedChange={(v) => onShowMarkersChange?.(v)} />
        <Label htmlFor="show-markers" className="text-xs">
          Markers
        </Label>
      </div>
      <Button
        variant={areaSelect ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => onAreaSelectChange?.(!areaSelect)}
      >
        <SquareDashedMousePointer className="h-3.5 w-3.5" />
        Select Area
      </Button>
      <Button
        variant={advancedAreaSelect ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => onAdvancedAreaSelectChange?.(!advancedAreaSelect)}
      >
        <Shapes className="h-3.5 w-3.5" />
        Advanced Select
      </Button>
      {heatmap && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Metric</Label>
            <Select
              value={metricCategory}
              onValueChange={handleMetricCategoryChange}
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redemptions">Redemptions</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="payouts">Pending Payouts</SelectItem>
                <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                <SelectItem value="market_data">Market Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isMarketDataMode && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Form</Label>
                <Select value={heatFormId} onValueChange={handleFormChange}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Select form…" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.map((f) => (
                      <SelectItem key={f.formId} value={f.formId}>
                        {f.formName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {heatFormId && selectedForm && (
                <div className="space-y-1">
                  <Label className="text-xs">Metric</Label>
                  <Select value={heatMetricId} onValueChange={handleMetricIdChange}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue placeholder="Select metric…" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedForm.metrics.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {heatMetricId && hasGroupBy && (
                <div className="space-y-1">
                  <Label className="text-xs">Group Value</Label>
                  <Select value={heatGroupValue} onValueChange={handleGroupValueChange}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All (aggregated)</SelectItem>
                      {groupValues.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Style</Label>
            <Select
              value={heatStyle}
              onValueChange={(v) => onHeatStyleChange(v as HeatStyle)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circles">Circles</SelectItem>
                <SelectItem value="smooth">Smooth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {heatStyle === "smooth" && (
            <>
              <div className="space-y-1 w-32">
                <Label className="text-xs">Radius: {heatRadius}px</Label>
                <Slider
                  min={10}
                  max={80}
                  step={5}
                  value={[heatRadius]}
                  onValueChange={([v]) => onHeatRadiusChange(v)}
                  className="py-1"
                />
              </div>
              <div className="space-y-1 w-32">
                <Label className="text-xs">Blur: {heatBlur}px</Label>
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[heatBlur]}
                  onValueChange={([v]) => onHeatBlurChange(v)}
                  className="py-1"
                />
              </div>
            </>
          )}
          <div className="space-y-1 w-32">
            <Label className="text-xs">Opacity: {Math.round(heatOpacity * 100)}%</Label>
            <Slider
              min={10}
              max={100}
              step={5}
              value={[Math.round(heatOpacity * 100)]}
              onValueChange={([v]) => onHeatOpacityChange(v / 100)}
              className="py-1"
            />
          </div>
        </>
      )}
      {isLoading && <Skeleton className="h-4 w-16" />}
    </div>
  );
}
