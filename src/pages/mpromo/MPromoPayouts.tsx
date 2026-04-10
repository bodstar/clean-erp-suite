import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getPayouts, payPayout } from "@/lib/api/mpromo";
import type { Payout } from "@/types/mpromo";
import { toast } from "sonner";

export default function MPromoPayouts() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canTrigger = hasPermission("mpromo.payouts.trigger") && scopeMode !== "all";

  const [pending, setPending] = useState<Payout[]>([]);
  const [paid, setPaid] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmPayout, setConfirmPayout] = useState<Payout | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getPayouts({ status: "pending" }, scope),
      getPayouts({ status: "paid" }, scope),
    ])
      .then(([p, d]) => { setPending(p.data); setPaid(d.data); })
      .catch(() => { setPending([]); setPaid([]); })
      .finally(() => setIsLoading(false));
  }, [scope]);

  const handlePay = async () => {
    if (!confirmPayout) return;
    try {
      await payPayout(confirmPayout.id, scope);
      toast.success("Payout initiated via Paystack");
      setPending((prev) => prev.filter((p) => p.id !== confirmPayout.id));
      setPaid((prev) => [{ ...confirmPayout, status: "paid" as const, paid_at: new Date().toISOString() }, ...prev]);
    } catch {
      toast.error("Payout failed");
    } finally {
      setConfirmPayout(null);
    }
  };

  const pendingCols: DataTableColumn<Payout>[] = [
    { key: "partner_name", header: "Partner", render: (r) => <Link to={`/mpromo/partners/${r.partner_id}`} className="text-primary hover:underline">{r.partner_name}</Link> },
    { key: "phone", header: "Phone" },
    { key: "amount", header: "Amount", render: (r) => `GH₵${r.amount.toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ...(scopeMode === "all"
      ? [{ key: "team_name", header: "Team", render: (r: Payout) => <TeamBadge teamName={r.team_name} /> } as DataTableColumn<Payout>]
      : []),
    ...(canTrigger
      ? [{
          key: "actions",
          header: "",
          className: "w-28",
          render: (r: Payout) => (
            <div className="flex gap-1">
              <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => setConfirmPayout(r)}>
                <DollarSign className="h-3 w-3" /> Pay
              </Button>
              {r.status === "failed" && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setConfirmPayout(r)}>
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              )}
            </div>
          ),
        } as DataTableColumn<Payout>]
      : []),
  ];

  const paidCols: DataTableColumn<Payout>[] = [
    { key: "partner_name", header: "Partner", render: (r) => <Link to={`/mpromo/partners/${r.partner_id}`} className="text-primary hover:underline">{r.partner_name}</Link> },
    { key: "amount", header: "Amount", render: (r) => `GH₵${r.amount.toLocaleString()}` },
    { key: "paystack_reference", header: "Paystack Ref", render: (r) => r.paystack_reference || "—" },
    { key: "paid_at", header: "Date", render: (r) => r.paid_at || "—" },
    ...(scopeMode === "all"
      ? [{ key: "team_name", header: "Team", render: (r: Payout) => <TeamBadge teamName={r.team_name} /> } as DataTableColumn<Payout>]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Pending Payouts</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={pendingCols} data={pending} isLoading={isLoading} emptyMessage="No pending payouts." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Paid Payouts</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={paidCols} data={paid} isLoading={isLoading} emptyMessage="No paid payouts yet." />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmPayout}
        onOpenChange={(open) => { if (!open) setConfirmPayout(null); }}
        title="Confirm Payout"
        description={`Are you sure you want to pay GH₵${confirmPayout?.amount.toLocaleString()} to "${confirmPayout?.partner_name}" via Paystack?`}
        confirmLabel="Pay Now"
        onConfirm={handlePay}
      />
    </div>
  );
}
