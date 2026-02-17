import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getCampaigns } from "@/lib/api/mpromo";
import type { Campaign } from "@/types/mpromo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MPromoCampaigns() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canManage = hasPermission("mpromo.campaign.manage") && scopeMode !== "all";

  const [data, setData] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getCampaigns(
      { page, search, status: statusFilter !== "all" ? statusFilter : undefined },
      scope
    )
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, statusFilter, scope]);

  const columns: DataTableColumn<Campaign>[] = [
    { key: "name", header: "Name" },
    { key: "type", header: "Type", render: (r) => r.type.replace("_", " ") },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "start_date", header: "Start" },
    { key: "end_date", header: "End" },
    { key: "total_redemptions", header: "Redemptions" },
    { key: "total_spend", header: "Spend", render: (r) => `₦${r.total_spend.toLocaleString()}` },
    ...(scopeMode === "all"
      ? [{ key: "team_name", header: "Team" } as DataTableColumn<Campaign>]
      : []),
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
      searchPlaceholder="Search campaigns..."
      isLoading={isLoading}
      emptyMessage="No campaigns found."
      filters={
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      }
      headerActions={
        canManage ? (
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/mpromo/campaigns/new")}>
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        ) : undefined
      }
    />
  );
}
