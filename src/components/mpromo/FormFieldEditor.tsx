import { Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField, FormFieldType } from "@/types/market-data";

interface FormFieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
}

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  checkbox: "Checkbox",
  date: "Date",
  textarea: "Textarea",
};

export function FormFieldEditor({ field, onChange, onDelete }: FormFieldEditorProps) {
  const updateField = (partial: Partial<FormField>) => onChange({ ...field, ...partial });

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0 cursor-grab" />
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[180px]">
            <Label className="text-xs">
              Field Label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="e.g. Cases in Stock"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 w-36">
            <Label className="text-xs">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={field.type}
              onValueChange={(v) =>
                updateField({
                  type: v as FormFieldType,
                  options: v === "select" ? field.options ?? ["Option 1"] : undefined,
                  allowCustomOption: v === "select" ? field.allowCustomOption : undefined,
                  allowMultiSelect: v === "select" ? field.allowMultiSelect : undefined,
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fieldTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => updateField({ required: v })}
            />
            <Label className="text-xs">Required</Label>
          </div>
        </div>

        {field.type === "select" && (
          <div className="space-y-3">
            <Label className="text-xs">Options</Label>
            <div className="flex flex-wrap gap-1.5">
              {(field.options ?? []).map((opt, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(field.options ?? [])];
                      newOpts[i] = e.target.value;
                      updateField({ options: newOpts });
                    }}
                    className="h-5 w-24 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOpts = (field.options ?? []).filter((_, j) => j !== i);
                      updateField({ options: newOpts });
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => updateField({ options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] })}
              >
                + Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={field.allowMultiSelect ?? false}
                  onCheckedChange={(v) => updateField({ allowMultiSelect: !!v })}
                />
                <span className="text-xs text-muted-foreground">Allow multiple selections</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={field.allowCustomOption ?? false}
                  onCheckedChange={(v) => updateField({ allowCustomOption: !!v })}
                />
                <span className="text-xs text-muted-foreground">Allow respondent to add custom option</span>
              </label>
            </div>
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}