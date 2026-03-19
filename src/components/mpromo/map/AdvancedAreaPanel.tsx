import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Square, Circle, Pentagon, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { AreaZone, ShapeMode, PolygonEndMode } from "@/types/area-zone";

interface AdvancedAreaPanelProps {
  zones: AreaZone[];
  activeZoneId: string | null;
  onAddZone: () => void;
  onRemoveZone: (id: string) => void;
  onSetActiveZone: (id: string | null) => void;
  onSetShapeMode: (id: string, mode: ShapeMode) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdatePolygonPointCount: (id: string, count: number) => void;
  onUpdatePolygonEndMode: (id: string, mode: PolygonEndMode) => void;
  onClearAll: () => void;
}

export function AdvancedAreaPanel({
  zones,
  activeZoneId,
  onAddZone,
  onRemoveZone,
  onSetActiveZone,
  onSetShapeMode,
  onUpdateLabel,
  onUpdatePolygonPointCount,
  onUpdatePolygonEndMode,
  onClearAll,
}: AdvancedAreaPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Advanced Selection</h3>
        <div className="flex items-center gap-1.5">
          {zones.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={onClearAll}
            >
              <X className="h-3.5 w-3.5" /> Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onAddZone}
            disabled={zones.length >= 6}
          >
            <Plus className="h-3.5 w-3.5" /> Add Zone
          </Button>
        </div>
      </div>

      {zones.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Click "Add Zone" to start defining selection areas
        </p>
      )}

      <div className="space-y-2">
        {zones.map((zone) => {
          const isActive = zone.id === activeZoneId;
          return (
            <div key={zone.id} className="space-y-1.5">
              <div
                className={`flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onSetActiveZone(isActive ? null : zone.id)}
              >
                {/* Color swatch */}
                <div
                  className="h-4 w-4 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: zone.color }}
                />

                {/* Editable label */}
                <Input
                  className="h-6 text-xs w-24 px-1.5 bg-transparent border-none focus-visible:ring-1"
                  value={zone.label}
                  onChange={(e) => onUpdateLabel(zone.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Shape mode toggle */}
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={zone.shapeMode}
                  onValueChange={(v) => {
                    if (v) onSetShapeMode(zone.id, v as ShapeMode);
                  }}
                  className="gap-0"
                >
                  <ToggleGroupItem
                    value="rectangle"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Rectangle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Square className="h-3 w-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="circle"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Circle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Circle className="h-3 w-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="polygon"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Polygon (point-by-point)"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pentagon className="h-3 w-3" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Partner count */}
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-auto">
                  {zone.partners.length} pts
                </Badge>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveZone(zone.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Polygon options row */}
              {zone.shapeMode === "polygon" && isActive && (
                <div
                  className="flex items-center gap-3 pl-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RadioGroup
                    value={zone.polygonEndMode}
                    onValueChange={(v) => onUpdatePolygonEndMode(zone.id, v as PolygonEndMode)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="count" id={`${zone.id}-count`} className="h-3 w-3" />
                      <Label htmlFor={`${zone.id}-count`} className="text-xs text-muted-foreground cursor-pointer">
                        Fixed points
                      </Label>
                      {zone.polygonEndMode === "count" && (
                        <Input
                          type="number"
                          min={3}
                          max={20}
                          className="h-6 w-12 text-xs px-1.5 text-center bg-transparent border-border"
                          value={zone.polygonPointCount}
                          onChange={(e) => onUpdatePolygonPointCount(zone.id, parseInt(e.target.value) || 3)}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="doubleclick" id={`${zone.id}-dblclick`} className="h-3 w-3" />
                      <Label htmlFor={`${zone.id}-dblclick`} className="text-xs text-muted-foreground cursor-pointer">
                        Double-click to finish
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
