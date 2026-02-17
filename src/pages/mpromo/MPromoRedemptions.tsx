import { useState, useEffect } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getRedemptions } from "@/lib/api/mpromo";
import type { Redemption } from "@/types/mpromo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MPromoRedemptions() {
  const { scope } = useMPromoScope();
  const [data, setData] = useState<Redemption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [payoutFilter, setPayoutFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getRedemptions(
      { page, search, payout_status: payoutFilter !== "all" ? payoutFilter : undefined },
      scope
    )
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, payoutFilter, scope]);

  const columns: DataTableColumn<Redemption>[] = [
    { key: "date", header: "Date/Time" },
    { key: "partner_name", header: "Partner" },
    { key: "partner_type", header: "Type", render: (r) => r.partner_type.replace("_", " ") },
    { key: "campaign_name", header: "Campaign" },
    { key: "amount", header: "Amount", render: (r) => `₦${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
    { key: "reference", header: "Reference" },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      total={total}
      page={page}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search redemptions..."
      isLoading={isLoading}
      emptyMessage="No redemptions found."
      filters={
        <Select value={payoutFilter} onValueChange={setPayoutFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Payout Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      }
    />
  );
}
