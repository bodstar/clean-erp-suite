import { useState, useEffect } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getPayouts, payPayout } from "@/lib/api/mpromo";
import type { Payout } from "@/types/mpromo";
import { toast } from "sonner";

export default function MPromoPayouts() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canManage = hasPermission("mpromo.payouts.manage") && scopeMode !== "all";

  const [pending, setPending] = useState<Payout[]>([]);
  const [paid, setPaid] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePay = async (id: number) => {
    try {
      await payPayout(id, scope);
      toast.success("Payout initiated via Paystack");
    } catch {
      toast.error("Payout failed");
    }
  };

  const pendingCols: DataTableColumn<Payout>[] = [
    { key: "partner_name", header: "Partner" },
    { key: "phone", header: "Phone" },
    { key: "amount", header: "Amount", render: (r) => `₦${r.amount.toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ...(canManage
      ? [{
          key: "actions",
          header: "",
          className: "w-28",
          render: (r: Payout) => (
            <div className="flex gap-1">
              <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => handlePay(r.id)}>
                <DollarSign className="h-3 w-3" /> Pay
              </Button>
              {r.status === "failed" && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handlePay(r.id)}>
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              )}
            </div>
          ),
        } as DataTableColumn<Payout>]
      : []),
  ];

  const paidCols: DataTableColumn<Payout>[] = [
    { key: "partner_name", header: "Partner" },
    { key: "amount", header: "Amount", render: (r) => `₦${r.amount.toLocaleString()}` },
    { key: "paystack_reference", header: "Paystack Ref", render: (r) => r.paystack_reference || "—" },
    { key: "paid_at", header: "Date", render: (r) => r.paid_at || "—" },
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
    </div>
  );
}
