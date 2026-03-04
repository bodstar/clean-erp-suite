import { useState, useEffect } from "react";
import { Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCodes, generateCodes, getCampaigns } from "@/lib/api/mpromo";
import type { PromoCode, Campaign } from "@/types/mpromo";
import { toast } from "sonner";

export default function MPromoCodes() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canManage = hasPermission("mpromo.codes.manage") && scopeMode !== "all";

  const [data, setData] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Generate panel
  const [quantity, setQuantity] = useState(10);
  const [expiry, setExpiry] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Cancel confirm
  const [confirmCode, setConfirmCode] = useState<PromoCode | null>(null);

  useEffect(() => {
    getCampaigns({ page_size: 100 }, scope)
      .then((res) => setCampaigns(res.data.filter((c) => c.status === "active" || c.status === "draft")))
      .catch(() => setCampaigns([]));
  }, [scope]);

  useEffect(() => {
    setIsLoading(true);
    getCodes({ page, search }, scope)
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, scope]);

  const handleGenerate = async () => {
    if (!campaignId || !expiry) {
      toast.error("Please fill all fields");
      return;
    }
    setIsGenerating(true);
    try {
      await generateCodes({ campaign_id: Number(campaignId), quantity, expires_at: expiry }, scope);
      toast.success(`${quantity} codes generated`);
    } catch {
      toast.error("Failed to generate codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelCode = () => {
    if (!confirmCode) return;
    // In demo mode, update locally; in real mode this would call an API
    setData((prev) =>
      prev.map((c) => (c.id === confirmCode.id ? { ...c, status: "cancelled" as const } : c))
    );
    toast.success(`Code ${confirmCode.code} cancelled`);
    setConfirmCode(null);
  };

  const columns: DataTableColumn<PromoCode>[] = [
    { key: "code", header: "Code", render: (r) => <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{r.code}</code> },
    { key: "campaign_name", header: "Campaign" },
    { key: "issued_to", header: "Issued To", render: (r) => r.issued_to || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "expires_at", header: "Expires" },
    { key: "redeemed_at", header: "Redeemed At", render: (r) => r.redeemed_at || "—" },
    ...(canManage
      ? [{
          key: "action",
          header: "",
          className: "w-10",
          render: (r: PromoCode) =>
            r.status === "active" ? (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setConfirmCode(r)}>
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            ) : null,
        } as DataTableColumn<PromoCode>]
      : []),
  ];

  return (
    <div className="space-y-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Generate Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Campaign</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" className="w-24" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expiry Date</Label>
                <Input type="date" className="w-40" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search codes..."
        isLoading={isLoading}
        emptyMessage="No codes found."
        headerActions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <ConfirmDialog
        open={!!confirmCode}
        onOpenChange={(open) => { if (!open) setConfirmCode(null); }}
        title="Cancel Promo Code"
        description={`Are you sure you want to cancel code "${confirmCode?.code}"? This action cannot be undone.`}
        confirmLabel="Cancel Code"
        variant="destructive"
        onConfirm={handleCancelCode}
      />
    </div>
  );
}
