import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSDScope } from "@/providers/SDScopeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getRoutes } from "@/lib/api/sd";
import { toast } from "sonner";
import type { SDRouteSummary } from "@/types/sd";

export default function SDRoutes() {
  const navigate = useNavigate();
  const { scope, canUseGlobalScope } = useSDScope();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sd.routes.manage");

  const [data, setData] = useState<SDRouteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getRoutes(
        { status: statusFilter !== "all" ? statusFilter : undefined },
        scope
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load routes");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, scope]);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  const columns: DataTableColumn<SDRouteSummary>[] = [
    {
      key: "date", header: "Date",
      render: (row) => (
        <button
          className="text-primary hover:underline font-medium text-left"
          onClick={() => navigate(`/sd/routes/${row.id}`)}
        >
          {row.date}
        </button>
      ),
    },
    {
      key: "driver", header: "Driver & Vehicle",
      render: (row) => (
        <div>
          <span className="font-medium">{row.driver_name}</span>
          <span className="text-muted-foreground text-xs ml-1">· {row.driver_vehicle}</span>
        </div>
      ),
    },
    {
      key: "status", header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "progress", header: "Stops",
      render: (row) => (
        <span className="text-sm">
          {row.completed_stops} of {row.stop_count} completed
        </span>
      ),
    },
    ...(canUseGlobalScope ? [{
      key: "team_name" as const, header: "Team",
      render: (row: SDRouteSummary) => <TeamBadge teamName={row.team_name} />,
    }] : []),
  ];

  const addButton = canManage ? (
    <Button size="sm" className="gap-1.5" onClick={() => navigate("/sd/routes/new")}>
      <Plus className="h-4 w-4" /> Create Route
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="h-4 w-4" /> Create Route
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Only HQ can manage routes</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        isLoading={isLoading}
        searchPlaceholder="Search routes..."
        emptyMessage="No routes found."
        headerActions={addButton}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
      />




    </>
  );
}
