import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getOrders } from "@/lib/api/mpromo";
import type { MPromoOrder } from "@/types/mpromo";

export default function MPromoOrders() {
  const { scope, scopeMode } = useMPromoScope();
  const [data, setData] = useState<MPromoOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getOrders({ page, search }, scope)
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, scope]);

  const columns: DataTableColumn<MPromoOrder>[] = [
    { key: "order_no", header: "Order No" },
    { key: "partner_name", header: "Partner" },
    { key: "date", header: "Date" },
    { key: "total", header: "Total", render: (r) => `₦${r.total.toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ...(scopeMode === "all"
      ? [{ key: "team_name", header: "Team" } as DataTableColumn<MPromoOrder>]
      : []),
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (r) => (
        <Link to={`/sales/orders/${r.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> View in Sales
          </Button>
        </Link>
      ),
    },
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
      searchPlaceholder="Search orders..."
      isLoading={isLoading}
      emptyMessage="No orders found."
    />
  );
}
