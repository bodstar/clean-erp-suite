import { useState, useEffect, useMemo } from "react";
import { Download, ChevronDown, ChevronUp, XCircle, Check, ChevronsUpDown, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCodeBatches, getCodeBatch, generateCodes, getCampaigns, type CodeBatch } from "@/lib/api/mpromo";
import type { PromoCode, Campaign } from "@/types/mpromo";
import { toast } from "sonner";

function BatchCodeTable({ codes, canCancel, onCancel }: { codes: PromoCode[]; canCancel: boolean; onCancel: (code: PromoCode) => void }) {
  return (
    <div className="border rounded-md overflow-hidden mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Issued To</th>
            <th className="px-3 py-2 font-medium">Redeemed At</th>
            {canCancel && <th className="px-3 py-2 w-10" />}
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-3 py-2"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code}</code></td>
              <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
              <td className="px-3 py-2 text-muted-foreground">{c.issued_to || "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.redeemed_at || "—"}</td>
              {canCancel && (
                <td className="px-3 py-2">
                  {c.status === "active" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onCancel(c)}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exportBatchPDF(batch: CodeBatch) {
  const codes = batch.codes || [];
  const win = window.open("", "_blank");
  if (!win) { toast.error("Popup blocked — please allow popups"); return; }

  const couponsHtml = codes.map((c) => `
    <div class="coupon">
      <div class="logo">Mobile Water</div>
      <div class="campaign">${batch.campaign_name}</div>
      <div class="code">${c.code}</div>
      <div class="amount">Reward: GH₵${batch.redemption_amount.toLocaleString()}</div>
      <div class="expiry">Valid until ${batch.expires_at}</div>
      <div class="instruction">Dial *920*7# to redeem</div>
      <div class="batch-ref">Batch #${batch.id}</div>
    </div>
  `).join("");

  win.document.write(`<!DOCTYPE html><html><head><title>Batch #${batch.id} Coupons</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .coupon {
    border: 1.5px dashed #888; padding: 14px 16px;
    width: 100%; height: calc((297mm - 20mm) / 4);
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    page-break-inside: avoid; text-align: center;
  }
  .logo { font-size: 16px; font-weight: 800; color: #0066cc; letter-spacing: 1px; margin-bottom: 4px; }
  .campaign { font-size: 11px; color: #555; margin-bottom: 8px; }
  .code { font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px; }
  .amount { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .expiry { font-size: 11px; color: #555; margin-bottom: 6px; }
  .instruction { font-size: 10px; color: #777; font-style: italic; margin-bottom: 4px; }
  .batch-ref { font-size: 9px; color: #aaa; }
</style></head><body>
<div class="grid">${couponsHtml}</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();
}

function exportBatchCSV(batch: CodeBatch) {
  const codes = batch.codes || [];
  const header = "Batch ID,Campaign,Code,Status,Redemption Amount (GH₵),Expires At,Generated By,Generated At";
  const rows = codes.map((c) =>
    `${batch.id},"${batch.campaign_name}","${c.code}",${c.status},${batch.redemption_amount},"${batch.expires_at}","${batch.generated_by_name}","${batch.created_at}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch-${batch.id}-codes.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BatchCard({
  batch,
  scopeMode,
  canCancel,
}: {
  batch: CodeBatch;
  scopeMode: string;
  canCancel: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [codes, setCodes] = useState<PromoCode[] | null>(batch.codes || null);
  const [loading, setLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState<PromoCode | null>(null);

  const handleToggle = async () => {
    if (expanded) { setExpanded(false); return; }
    if (!codes) {
      setLoading(true);
      try {
        const full = await getCodeBatch(batch.id);
        setCodes(full.codes || []);
      } catch { toast.error("Failed to load codes"); }
      finally { setLoading(false); }
    }
    setExpanded(true);
  };

  const handleExportPDF = async () => {
    let c = codes;
    if (!c) {
      try { const full = await getCodeBatch(batch.id); c = full.codes || []; setCodes(c); } catch { toast.error("Failed to load codes"); return; }
    }
    exportBatchPDF({ ...batch, codes: c });
  };

  const handleExportCSV = async () => {
    let c = codes;
    if (!c) {
      try { const full = await getCodeBatch(batch.id); c = full.codes || []; setCodes(c); } catch { toast.error("Failed to load codes"); return; }
    }
    exportBatchCSV({ ...batch, codes: c });
  };

  const handleCancelCode = () => {
    if (!confirmCode || !codes) return;
    setCodes(codes.map((c) => c.id === confirmCode.id ? { ...c, status: "cancelled" as const } : c));
    toast.success(`Code ${confirmCode.code} cancelled`);
    setConfirmCode(null);
  };

  const progress = batch.quantity > 0 ? (batch.redeemed_count / batch.quantity) * 100 : 0;

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{batch.campaign_name}</span>
                {scopeMode === "all" && <TeamBadge teamName={batch.team_name} />}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Generated {batch.created_at}</span>
                <span>by {batch.generated_by_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{batch.quantity}</div>
                <div className="text-xs text-muted-foreground">codes</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">GH₵{batch.redemption_amount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">per code</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{batch.expires_at}</div>
                <div className="text-xs text-muted-foreground">expires</div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {batch.redeemed_count} redeemed · {batch.active_count} active / {batch.quantity}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading} className="gap-1.5">
              {loading ? "Loading..." : expanded ? <><ChevronUp className="h-4 w-4" /> Hide Codes</> : <><ChevronDown className="h-4 w-4" /> View Codes</>}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Printer className="h-4 w-4 mr-2" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {expanded && codes && (
            <BatchCodeTable codes={codes} canCancel={canCancel} onCancel={setConfirmCode} />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmCode}
        onOpenChange={(open) => { if (!open) setConfirmCode(null); }}
        title="Cancel Promo Code"
        description={`Are you sure you want to cancel code "${confirmCode?.code}"? This action cannot be undone.`}
        confirmLabel="Cancel Code"
        variant="destructive"
        onConfirm={handleCancelCode}
      />
    </>
  );
}

export default function MPromoCodes() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canGenerate = hasPermission("mpromo.codes.generate") && scopeMode !== "all";
  const canCancel = hasPermission("mpromo.codes.cancel") && scopeMode !== "all";

  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Generate panel
  const [quantity, setQuantity] = useState(10);
  const [expiry, setExpiry] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [selectedTierIndex, setSelectedTierIndex] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    getCampaigns({ page_size: 100 }, scope)
      .then((res) => setCampaigns(res.data.filter((c) => c.status === "active" || c.status === "draft")))
      .catch(() => setCampaigns([]));
  }, [scope]);

  useEffect(() => {
    setIsLoading(true);
    getCodeBatches({ page, search }, scope)
      .then((res) => { setBatches(res.data); setTotal(res.total); })
      .catch(() => { setBatches([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, scope]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => String(c.id) === campaignId),
    [campaigns, campaignId]
  );

  const redemptionAmount = useMemo(() => {
    if (!selectedCampaign) return 0;
    if (selectedCampaign.type === "MYSTERY_SHOPPER") return selectedCampaign.reward_amount || 0;
    if (selectedCampaign.type === "VOLUME_REBATE" && selectedCampaign.tiers?.length) {
      const idx = Number(selectedTierIndex);
      if (!isNaN(idx) && selectedCampaign.tiers[idx]) return selectedCampaign.tiers[idx].reward_amount;
    }
    return 0;
  }, [selectedCampaign, selectedTierIndex]);

  useEffect(() => { setSelectedTierIndex(""); }, [campaignId]);

  const handleGenerate = async () => {
    if (!campaignId || !expiry) { toast.error("Please fill all fields"); return; }
    if (redemptionAmount <= 0) {
      toast.error(selectedCampaign?.type === "VOLUME_REBATE" ? "Please select a tier" : "Campaign has no reward amount");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateCodes({ campaign_id: Number(campaignId), quantity, expires_at: expiry, redemption_amount: redemptionAmount }, scope);
      toast.success(`${quantity} codes generated`);
      // Fetch the new batch and prepend
      try {
        const newBatch = await getCodeBatch(result.batch_id);
        setBatches((prev) => [newBatch, ...prev]);
        setTotal((prev) => prev + 1);
      } catch {
        // Fallback: just reload
        getCodeBatches({ page: 1, search }, scope)
          .then((res) => { setBatches(res.data); setTotal(res.total); })
          .catch(() => {});
      }
    } catch {
      toast.error("Failed to generate codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-4">
      {canGenerate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Generate Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Campaign</Label>
                <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-52 h-9 justify-between font-normal text-sm flex">
                      {campaignId
                        ? campaigns.find((c) => String(c.id) === campaignId)?.name ?? "Select campaign"
                        : "Select campaign"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-0">
                    <Command>
                      <CommandInput placeholder="Search campaigns..." />
                      <CommandList>
                        <CommandEmpty>No campaigns found.</CommandEmpty>
                        <CommandGroup>
                          {campaigns.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => { setCampaignId(String(c.id)); setCampaignOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", campaignId === String(c.id) ? "opacity-100" : "opacity-0")} />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedCampaign?.type === "VOLUME_REBATE" && selectedCampaign.tiers && selectedCampaign.tiers.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Tier</Label>
                  <Select value={selectedTierIndex} onValueChange={setSelectedTierIndex}>
                    <SelectTrigger className="w-56 h-9">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCampaign.tiers.map((t, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {t.threshold}+ units → GH₵{t.reward_amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCampaign?.type === "MYSTERY_SHOPPER" && (
                <div className="space-y-1">
                  <Label className="text-xs">Reward Amount</Label>
                  <Input className="w-36" value={`GH₵${selectedCampaign.reward_amount?.toLocaleString() ?? 0}`} readOnly disabled />
                </div>
              )}

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

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search batches by campaign..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
      </div>

      {/* Batch list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">No code batches found.</div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} scopeMode={scopeMode} canCancel={canCancel} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
