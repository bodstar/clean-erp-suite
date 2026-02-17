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
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCodes, generateCodes } from "@/lib/api/mpromo";
import type { PromoCode } from "@/types/mpromo";
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
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                <Label className="text-xs">Campaign ID</Label>
                <Input className="w-28" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="ID" />
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
    </div>
  );
}
