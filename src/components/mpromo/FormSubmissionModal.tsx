import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormDefinition } from "@/types/market-data";

interface FormSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  form: FormDefinition;
  partnerName: string;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}

export function FormSubmissionModal({ open, onClose, form, partnerName, onSubmit }: FormSubmissionModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const handleSubmit = async () => {
    // Basic required validation
    for (const field of sortedFields) {
      if (field.required) {
        const val = values[field.id];
        if (val === undefined || val === null || val === "") {
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.name}</DialogTitle>
          <DialogDescription>
            Submitting for <strong>{partnerName}</strong>
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-destructive">* required</p>
        <div className="space-y-4">
          {sortedFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label className="text-sm">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.type === "text" && (
                <Input
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="h-9"
                />
              )}
              {field.type === "number" && (
                <Input
                  type="number"
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value ? Number(e.target.value) : "")}
                  className="h-9"
                />
              )}
              {field.type === "date" && (
                <Input
                  type="date"
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="h-9"
                />
              )}
              {field.type === "textarea" && (
                <Textarea
                  value={values[field.id] ?? ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  rows={3}
                />
              )}
              {field.type === "checkbox" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!values[field.id]}
                    onCheckedChange={(v) => updateValue(field.id, !!v)}
                  />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              )}
              {field.type === "select" && (
                <Select
                  value={values[field.id] ?? ""}
                  onValueChange={(v) => updateValue(field.id, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
