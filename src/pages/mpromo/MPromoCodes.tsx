import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCodeBatches, getCodeBatch, generateCodes, getCampaigns, type CodeBatch } from "@/lib/api/mpromo";
import type { Campaign } from "@/types/mpromo";
import { toast } from "sonner";
import { BatchCard } from "@/components/mpromo/BatchCard";


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
