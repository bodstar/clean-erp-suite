import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/sd/SourceBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { useAuth } from "@/providers/AuthProvider";
import { getSDOrders } from "@/lib/api/sd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SDOrderSummary, SDOrderStatus, SDOrderSource } from "@/types/sd";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "assigned", label: "Assigned" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const sourceOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "web", label: "Web" },
  { value: "ussd", label: "USSD" },
  { value: "mobile", label: "Mobile" },
  { value: "mpromo", label: "M-Promo" },
];

export default function SDOrders() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<SDOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const canCreate = hasPermission("sd.orders.create");

  useEffect(() => {
    setIsLoading(true);
    getSDOrders({ page, search: search || undefined, status: statusFilter, source: sourceFilter })
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, statusFilter, sourceFilter]);

  const columns: DataTableColumn<SDOrderSummary>[] = [
    {
      key: "order_no",
      header: "Order #",
      render: (r) => (
        <button
          onClick={() => navigate(`/sd/orders/${r.id}`)}
          className="text-primary hover:underline font-medium"
        >
          {r.order_no}
        </button>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (r) => r.partner_name || r.unregistered_customer_name || "—",
    },
    {
      key: "source",
      header: "Source",
      render: (r) => <SourceBadge source={r.source} />,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: "item_count", header: "Items" },
    {
      key: "total",
      header: "Total",
      render: (r) => `GH₵${r.total.toLocaleString()}`,
    },
    {
      key: "scheduled_at",
      header: "Scheduled",
      render: (r) => r.scheduled_at ? new Date(r.scheduled_at).toLocaleDateString() : "—",
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      key: "team_name",
      header: "Team",
      render: (r) => r.team_name ? <TeamBadge teamName={r.team_name} /> : "—",
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
      searchPlaceholder="Search by order # or customer..."
      isLoading={isLoading}
      emptyMessage="No orders found."
      filters={
        <>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
      headerActions={
        canCreate ? (
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/sd/orders/new")}>
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        ) : undefined
      }
    />
  );
}
