/**
 * @module MPromoFormDetail
 * Detail page for a single Market Data form.
 * Shows form metadata, a partner selector with "Fill Form" button
 * to open the submission modal, and a dynamic submissions table
 * with columns generated from the form's field definitions.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormSubmissionsTable } from "@/components/mpromo/FormSubmissionsTable";
import { FormSubmissionModal } from "@/components/mpromo/FormSubmissionModal";
import { getForm, getSubmissions, createSubmission } from "@/lib/api/market-data";
import { getPartners } from "@/lib/api/mpromo";
import type { FormDefinition, FormSubmission } from "@/types/market-data";
import type { Partner } from "@/types/mpromo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function MPromoFormDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    const [f, subs, { data: ptrs }] = await Promise.all([
      getForm(id),
      getSubmissions(id),
      getPartners({ page_size: 100 }),
    ]);
    setForm(f);
    setSubmissions(subs);
    setPartners(ptrs);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const selectedPartner = partners.find((p) => String(p.id) === selectedPartnerId);

  const handleSubmit = async (values: Record<string, any>) => {
    if (!form || !selectedPartner) return;
    await createSubmission({
      form_id: form.id,
      partner_id: selectedPartner.id,
      partner_name: selectedPartner.name,
      submitted_at: new Date().toISOString().replace("T", " ").slice(0, 16),
      submitted_by: "Current User",
      values,
    });
    toast.success("Submission recorded");
    setSelectedPartnerId("");
    load();
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/market-data")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Forms
      </Button>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{form.name}</h2>
              <p className="text-sm text-muted-foreground">{form.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={form.status} />
                <span className="text-xs text-muted-foreground">{form.fields.length} fields · {submissions.length} submissions</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/mpromo/market-data/${form.id}/edit`)} className="gap-1.5">
                <Pencil className="h-4 w-4" /> Edit Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Submission */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Add Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a partner..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              disabled={!selectedPartnerId}
              onClick={() => setSubmitOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Fill Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSubmissionsTable form={form} submissions={submissions} />
        </CardContent>
      </Card>

      {submitOpen && selectedPartner && (
        <FormSubmissionModal
          open={submitOpen}
          onClose={() => { setSubmitOpen(false); setSelectedPartnerId(""); }}
          form={form}
          partnerName={selectedPartner.name}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
