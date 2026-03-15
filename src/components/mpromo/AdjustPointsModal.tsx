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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Minus } from "lucide-react";

interface AdjustPointsModalProps {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  currentPoints: number;
  onConfirm: (adjustment: { type: "add" | "deduct"; amount: number; reason: string }) => Promise<void>;
}

export function AdjustPointsModal({
  open,
  onClose,
  partnerName,
  currentPoints,
  onConfirm,
}: AdjustPointsModalProps) {
  const [type, setType] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = parseInt(amount, 10);
  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= 100000 &&
    reason.trim().length >= 3 &&
    reason.trim().length <= 500;

  const newBalance =
    type === "add"
      ? currentPoints + (parsedAmount || 0)
      : currentPoints - (parsedAmount || 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    if (type === "deduct" && parsedAmount > currentPoints) {
      setError("Cannot deduct more points than the current balance.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm({ type, amount: parsedAmount, reason: reason.trim() });
      handleClose();
    } catch {
      setError("Failed to adjust points. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setType("add");
    setAmount("");
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Loyalty Points</DialogTitle>
          <DialogDescription>
            Manually adjust points for <span className="font-medium text-foreground">{partnerName}</span>.
            Current balance: <span className="font-medium text-foreground">{currentPoints.toLocaleString()} pts</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Action</Label>
            <ToggleGroup
              type="single"
              value={type}
              onValueChange={(v) => v && setType(v as "add" | "deduct")}
              className="justify-start"
            >
              <ToggleGroupItem value="add" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Points
              </ToggleGroupItem>
              <ToggleGroupItem value="deduct" className="gap-1.5">
                <Minus className="h-4 w-4" /> Deduct Points
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points-amount">Points Amount</Label>
            <Input
              id="points-amount"
              type="number"
              min={1}
              max={100000}
              placeholder="e.g. 50"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
            />
            {parsedAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                New balance: <span className={newBalance < 0 ? "text-destructive" : "font-medium text-foreground"}>{newBalance.toLocaleString()} pts</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="points-reason">Reason</Label>
            <Textarea
              id="points-reason"
              placeholder="Explain the reason for this adjustment…"
              maxLength={500}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Saving…" : `${type === "add" ? "Add" : "Deduct"} ${parsedAmount > 0 ? parsedAmount.toLocaleString() : ""} pts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
