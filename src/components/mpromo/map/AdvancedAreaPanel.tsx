import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Square, Circle, Pentagon, X, Pencil, Lock, Check, Move, RefreshCw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AreaZone, ShapeMode, PolygonEndMode, PolygonEditMode } from "@/types/area-zone";

interface AdvancedAreaPanelProps {
  zones: AreaZone[];
  activeZoneId: string | null;
  lockedZoneIds: Set<string>;
  dragEditingZoneId: string | null;
  onAddZone: () => void;
  onRemoveZone: (id: string) => void;
  onSetActiveZone: (id: string | null) => void;
  onSetShapeMode: (id: string, mode: ShapeMode) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdatePolygonPointCount: (id: string, count: number) => void;
  onUpdatePolygonEndMode: (id: string, mode: PolygonEndMode) => void;
  onClearAll: () => void;
  onUnlockZone: (id: string, editMode?: PolygonEditMode) => void;
  onFinishDragEdit: (id: string) => void;
}

export function AdvancedAreaPanel({
  zones,
  activeZoneId,
  lockedZoneIds,
  dragEditingZoneId,
  onAddZone,
  onRemoveZone,
  onSetActiveZone,
  onSetShapeMode,
  onUpdateLabel,
  onUpdatePolygonPointCount,
  onUpdatePolygonEndMode,
  onClearAll,
  onUnlockZone,
  onFinishDragEdit,
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
          const isLocked = lockedZoneIds.has(zone.id);
          const hasShape = zone.layer !== null;
          const isDragEditing = zone.id === dragEditingZoneId;
          const isPolygon = zone.shapeMode === "polygon";
          const isDisabled = isLocked || isDragEditing;

          return (
            <div key={zone.id} className="space-y-1.5">
              <div
                className={`flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : isDragEditing
                    ? "border-accent bg-accent/5"
                      : isLocked
                        ? "border-border bg-muted/30"
                        : "border-border hover:bg-muted/50"
                }`}
                onClick={() => {
                  if (isLocked || isDragEditing) return;
                  onSetActiveZone(isActive ? null : zone.id);
                }}
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
                  disabled={isDisabled}
                />

                {/* Shape mode toggle */}
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={zone.shapeMode}
                  onValueChange={(v) => {
                    if (v && !isDisabled) onSetShapeMode(zone.id, v as ShapeMode);
                  }}
                  className="gap-0"
                >
                  <ToggleGroupItem
                    value="rectangle"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Rectangle"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDisabled}
                  >
                    <Square className="h-3 w-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="circle"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Circle"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDisabled}
                  >
                    <Circle className="h-3 w-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="polygon"
                    className="h-6 w-6 p-0 data-[state=on]:bg-primary/15"
                    title="Polygon (point-by-point)"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDisabled}
                  >
                    <Pentagon className="h-3 w-3" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Lock / Drag-edit indicator */}
                {isLocked && (
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                {isDragEditing && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-warning text-warning-foreground">
                    <Move className="h-2.5 w-2.5 mr-0.5" /> Dragging
                  </Badge>
                )}

                {/* Partner count */}
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-auto">
                  {zone.partners.length} pts
                </Badge>

                {/* Finish drag edit button */}
                {isDragEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                    title="Finish editing"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinishDragEdit(zone.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Edit / Unlock button */}
                {hasShape && isLocked && !isDragEditing && (
                  isPolygon ? (
                    <PolygonEditPopover
                      zoneId={zone.id}
                      onUnlockZone={onUnlockZone}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                      title="Edit zone"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockZone(zone.id);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )
                )}

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
              {zone.shapeMode === "polygon" && isActive && !isLocked && !isDragEditing && (
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
                        Long-press to finish
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Drag edit hints */}
              {isDragEditing && (
                <div className="flex items-center gap-3 pl-8 text-[10px] text-muted-foreground">
                  <span>Click map to <strong>add</strong> vertex</span>
                  <span>•</span>
                  <span>Right-click node to <strong>remove</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Popover for polygon edit mode choice */
function PolygonEditPopover({
  zoneId,
  onUnlockZone,
}: {
  zoneId: string;
  onUnlockZone: (id: string, editMode?: PolygonEditMode) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          title="Edit zone"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="end" side="bottom">
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-xs hover:bg-muted transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onUnlockZone(zoneId, "drag");
            }}
          >
            <Move className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">Drag nodes</div>
              <div className="text-muted-foreground text-[10px]">Move existing vertices</div>
            </div>
          </button>
          <button
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-xs hover:bg-muted transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onUnlockZone(zoneId, "redraw");
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">Redraw</div>
              <div className="text-muted-foreground text-[10px]">Draw new points from scratch</div>
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
