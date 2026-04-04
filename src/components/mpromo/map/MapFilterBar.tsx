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

export type HeatMetric = "redemptions" | "orders" | "payouts" | "loyalty_points";
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
  isLoading: boolean;
  areaSelect?: boolean;
  onAreaSelectChange?: (value: boolean) => void;
  showMarkers?: boolean;
  onShowMarkersChange?: (value: boolean) => void;
  advancedAreaSelect?: boolean;
  onAdvancedAreaSelectChange?: (value: boolean) => void;
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
  isLoading,
  areaSelect,
  onAreaSelectChange,
  showMarkers,
  onShowMarkersChange,
  advancedAreaSelect,
  onAdvancedAreaSelectChange,
}: MapFilterBarProps) {
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
              value={heatMetric}
              onValueChange={(v) => onHeatMetricChange(v as HeatMetric)}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redemptions">Redemptions</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="payouts">Pending Payouts</SelectItem>
                <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        </>
      )}
      {isLoading && <Skeleton className="h-4 w-16" />}
    </div>
  );
}
