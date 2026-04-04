import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldEditor } from "@/components/mpromo/FormFieldEditor";
import { createForm, getForm, updateForm } from "@/lib/api/market-data";
import type { FormField, FormFieldType, FormStatus } from "@/types/market-data";
import { toast } from "sonner";

export default function MPromoFormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FormStatus>("draft");
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getForm(id).then((form) => {
      if (!form) { navigate("/mpromo/market-data"); return; }
      setName(form.name);
      setDescription(form.description);
      setStatus(form.status);
      setFields(form.fields);
    });
  }, [id, isEdit, navigate]);

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: "",
      type: "text",
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, field: FormField) => {
    const updated = [...fields];
    updated[index] = field;
    setFields(updated);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 })));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Form name is required"); return; }
    if (fields.length === 0) { toast.error("Add at least one field"); return; }
    if (fields.some((f) => !f.label.trim())) { toast.error("All fields must have labels"); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await updateForm(id, { name, description, status, fields });
        toast.success("Form updated");
      } else {
        await createForm({ name, description, status, fields });
        toast.success("Form created");
      }
      navigate("/mpromo/market-data");
    } catch {
      toast.error("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/market-data")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Forms
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? "Edit Form" : "Create Form"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5">
            <Eye className="h-4 w-4" /> {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Form" : "Create Form"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        {/* Builder */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-destructive">* required</p>
              <div className="space-y-1.5">
                <Label>Form Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly Stock Check" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What data does this form collect?" rows={2} />
              </div>
              <div className="space-y-1.5 w-40">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FormStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedFields.map((field, i) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  onChange={(f) => updateField(fields.findIndex((ff) => ff.id === field.id), f)}
                  onDelete={() => deleteField(fields.findIndex((ff) => ff.id === field.id))}
                />
              ))}
              <Button variant="outline" onClick={addField} className="w-full gap-1.5">
                <Plus className="h-4 w-4" /> Add Field
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card className="h-fit sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-foreground">{name || "Untitled Form"}</h3>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <Separator />
              {sortedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add fields to see a preview</p>
              ) : (
                sortedFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm">
                      {field.label || "Untitled Field"}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    {field.type === "text" && <Input disabled placeholder={field.label} className="h-9" />}
                    {field.type === "number" && <Input type="number" disabled placeholder="0" className="h-9" />}
                    {field.type === "date" && <Input type="date" disabled className="h-9" />}
                    {field.type === "textarea" && <Textarea disabled rows={2} />}
                    {field.type === "checkbox" && (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-input" />
                        <span className="text-sm text-muted-foreground">Yes</span>
                      </div>
                    )}
                    {field.type === "select" && (
                      <Select disabled>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={field.options?.[0] ?? "Select..."} />
                        </SelectTrigger>
                      </Select>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
