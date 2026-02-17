import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { createCampaign } from "@/lib/api/mpromo";
import type { CampaignType, CampaignTier } from "@/types/mpromo";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function MPromoCampaignCreate() {
  const navigate = useNavigate();
  const { scope, scopeMode, targetTeamId } = useMPromoScope();
  const { teams } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("VOLUME_REBATE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2
  const [tiers, setTiers] = useState<CampaignTier[]>([{ threshold: 0, reward_amount: 0 }]);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  const targetTeam = teams.find((t) => t.id === targetTeamId);

  const isStep1Valid = name.trim() && startDate && endDate;
  const isStep2Valid =
    type === "MYSTERY_SHOPPER"
      ? rewardAmount > 0
      : tiers.every((t) => t.threshold > 0 && t.reward_amount > 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createCampaign(
        {
          name,
          type,
          start_date: startDate,
          end_date: endDate,
          ...(type === "VOLUME_REBATE" ? { tiers } : { reward_amount: rewardAmount }),
        },
        scope
      );
      toast.success("Campaign created!");
      navigate("/mpromo/campaigns");
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/campaigns")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </Button>

      {/* Progress */}
      <div className="flex gap-2 items-center text-sm">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === s
                ? "bg-primary text-primary-foreground"
                : step > s
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step > s ? <Check className="h-3 w-3" /> : s}
            {s === 1 ? " Basics" : s === 2 ? " Rules" : " Review"}
          </div>
        ))}
      </div>

      {scopeMode === "target" && targetTeam && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm">
          Creating for team: <span className="font-semibold">{targetTeam.name}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Campaign Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 Volume Rebate" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CampaignType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VOLUME_REBATE">Volume Rebate</SelectItem>
                  <SelectItem value="MYSTERY_SHOPPER">Mystery Shopper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={!isStep1Valid} onClick={() => setStep(2)} className="gap-1.5">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {type === "VOLUME_REBATE" ? (
              <div className="space-y-3">
                <Label>Tiers</Label>
                {tiers.map((tier, i) => (
                  <div key={i} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Threshold</Label>
                      <Input
                        type="number"
                        value={tier.threshold || ""}
                        onChange={(e) => {
                          const n = [...tiers];
                          n[i] = { ...n[i], threshold: Number(e.target.value) };
                          setTiers(n);
                        }}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Reward (₦)</Label>
                      <Input
                        type="number"
                        value={tier.reward_amount || ""}
                        onChange={(e) => {
                          const n = [...tiers];
                          n[i] = { ...n[i], reward_amount: Number(e.target.value) };
                          setTiers(n);
                        }}
                        placeholder="e.g. 500"
                      />
                    </div>
                    {tiers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setTiers([...tiers, { threshold: 0, reward_amount: 0 }])}>
                  + Add Tier
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Reward per Valid Code (₦)</Label>
                <Input
                  type="number"
                  value={rewardAmount || ""}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  placeholder="e.g. 200"
                />
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!isStep2Valid} onClick={() => setStep(3)} className="gap-1.5">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Review & Create</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span>
              <span className="text-muted-foreground">Type</span><span className="font-medium">{type.replace("_", " ")}</span>
              <span className="text-muted-foreground">Dates</span><span className="font-medium">{startDate} → {endDate}</span>
              {type === "MYSTERY_SHOPPER" && (
                <>
                  <span className="text-muted-foreground">Reward</span>
                  <span className="font-medium">₦{rewardAmount.toLocaleString()}</span>
                </>
              )}
            </div>
            {type === "VOLUME_REBATE" && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Tiers:</p>
                {tiers.map((t, i) => (
                  <p key={i}>≥ {t.threshold} units → ₦{t.reward_amount.toLocaleString()}</p>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
