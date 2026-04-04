import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Pencil, Archive, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getForms, deleteForm, updateForm } from "@/lib/api/market-data";
import type { FormDefinition } from "@/types/market-data";
import { toast } from "sonner";

export default function MPromoMarketData() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FormDefinition | null>(null);

  const load = async () => {
    setIsLoading(true);
    const data = await getForms();
    setForms(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteForm(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
    load();
  };

  const handleStatusToggle = async (form: FormDefinition) => {
    const newStatus = form.status === "active" ? "archived" : "active";
    await updateForm(form.id, { status: newStatus });
    toast.success(`"${form.name}" ${newStatus === "active" ? "activated" : "archived"}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Market Data Forms</h2>
          <p className="text-sm text-muted-foreground">Build and manage forms for field data collection</p>
        </div>
        <Button onClick={() => navigate("/mpromo/market-data/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Form
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No forms yet. Create your first form to start collecting market data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary hover:underline text-left"
                      onClick={() => navigate(`/mpromo/market-data/${form.id}`)}
                    >
                      {form.name}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={form.status} />
                      <span className="text-xs text-muted-foreground">{form.fields.length} fields</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/mpromo/market-data/${form.id}/edit`)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleStatusToggle(form)}
                      title={form.status === "active" ? "Archive" : "Activate"}
                    >
                      {form.status === "active" ? <Archive className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(form)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Updated {form.updated_at}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Form"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All submissions will also be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
