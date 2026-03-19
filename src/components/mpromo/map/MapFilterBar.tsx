import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SquareDashedMousePointer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type HeatMetric = "redemptions" | "orders" | "payouts" | "loyalty_points";

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
  isLoading: boolean;
  areaSelect?: boolean;
  onAreaSelectChange?: (value: boolean) => void;
  showMarkers?: boolean;
  onShowMarkersChange?: (value: boolean) => void;
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
  isLoading,
  areaSelect,
  onAreaSelectChange,
  showMarkers,
  onShowMarkersChange,
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
      <Button
        variant={areaSelect ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => onAreaSelectChange?.(!areaSelect)}
      >
        <SquareDashedMousePointer className="h-3.5 w-3.5" />
        Select Area
      </Button>
      {heatmap && (
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
      )}
      {isLoading && <Skeleton className="h-4 w-16" />}
    </div>
  );
}
