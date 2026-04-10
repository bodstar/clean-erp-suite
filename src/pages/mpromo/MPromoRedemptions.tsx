import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getRedemptions, exportList } from "@/lib/api/mpromo";
import type { Redemption } from "@/types/mpromo";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MPromoRedemptions() {
  const { scope, scopeMode } = useMPromoScope();
  const [data, setData] = useState<Redemption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [payoutFilter, setPayoutFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "partner_name", header: "Partner", render: (r) => <Link to={`/mpromo/partners/${r.partner_id}`} className="text-primary hover:underline">{r.partner_name}</Link> },
    { key: "partner_type", header: "Type", render: (r) => r.partner_type.replace("_", " ") },
    { key: "campaign_name", header: "Campaign" },
    { key: "amount", header: "Amount", render: (r) => `GH₵${r.amount.toLocaleString()}` },
    { key: "payout_status", header: "Payout", render: (r) => <StatusBadge status={r.payout_status} /> },
    { key: "reference", header: "Reference" },
    ...(scopeMode === "all"
      ? [{ key: "team_name", header: "Team", render: (r: Redemption) => <TeamBadge teamName={r.team_name} /> } as DataTableColumn<Redemption>]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true);
            try {
              await exportList('/mpromo/export/redemptions/sign', {
                search,
                payout_status: payoutFilter !== 'all' ? payoutFilter : undefined,
              });
            } catch { toast.error('Export failed'); }
            finally { setIsExporting(false); }
          }}
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
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
    </div>
  );
}
