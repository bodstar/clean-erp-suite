import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSDScope } from "@/providers/SDScopeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getRoutes, getDrivers, getSDOrders, createRoute } from "@/lib/api/sd";
import { toast } from "sonner";
import type { SDRouteSummary, SDDriver, SDOrderSummary } from "@/types/sd";

interface StopEntry {
  order_id: number;
  order_no: string;
  customer_name: string;
  delivery_address: string;
}

export default function SDRoutes() {
  const navigate = useNavigate();
  const { scope, canUseGlobalScope } = useSDScope();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sd.routes.manage");

  const [data, setData] = useState<SDRouteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create route wizard state
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [availableDrivers, setAvailableDrivers] = useState<SDDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [routeDate, setRouteDate] = useState("");
  const [confirmedOrders, setConfirmedOrders] = useState<SDOrderSummary[]>([]);
  const [stops, setStops] = useState<StopEntry[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openWizard = async () => {
    setStep(1);
    setSelectedDriverId("");
    setRouteDate(new Date().toISOString().slice(0, 10));
    setStops([]);
    setOrderSearch("");
    setShowCreate(true);
    try {
      const [driversRes, ordersRes] = await Promise.all([
        getDrivers({ status: "available" }, scope),
        getSDOrders({ status: "confirmed" }, scope),
      ]);
      setAvailableDrivers(driversRes.data);
      setConfirmedOrders(ordersRes.data);
    } catch {
      toast.error("Failed to load data for route creation");
    }
  };

  const addStop = (order: SDOrderSummary) => {
    if (stops.some(s => s.order_id === order.id)) return;
    setStops(prev => [...prev, {
      order_id: order.id,
      order_no: order.order_no,
      customer_name: order.partner_name || order.unregistered_customer_name || "—",
      delivery_address: order.delivery_address,
    }]);
  };

  const removeStop = (orderId: number) => {
    setStops(prev => prev.filter(s => s.order_id !== orderId));
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const arr = [...stops];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setStops(arr);
  };

  const handleCreateRoute = async () => {
    setIsSubmitting(true);
    try {
      const route = await createRoute({
        driver_id: Number(selectedDriverId),
        date: routeDate,
        stops: stops.map((s, i) => ({ order_id: s.order_id, sequence: i + 1 })),
      }, scope);
      toast.success("Route created");
      setShowCreate(false);
      navigate(`/sd/routes/${route.id}`);
    } catch {
      toast.error("Failed to create route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = confirmedOrders.filter(o => {
    if (stops.some(s => s.order_id === o.id)) return false;
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return o.order_no.toLowerCase().includes(q) ||
      (o.partner_name ?? "").toLowerCase().includes(q) ||
      (o.unregistered_customer_name ?? "").toLowerCase().includes(q);
  });

  const selectedDriverObj = availableDrivers.find(d => d.id === Number(selectedDriverId));

  const columns: DataTableColumn<SDRouteSummary>[] = [
    { key: "date", header: "Date" },
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
      render: (row: SDRouteSummary) => <TeamBadge name={row.team_name} />,
    }] : []),
  ];

  const addButton = canManage ? (
    <Button size="sm" className="gap-1.5" onClick={openWizard}>
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

      {/* Clickable rows - using CSS on the table */}
      {!isLoading && data.length > 0 && (
        <style>{`
          .route-table-clickable tr[data-route-id] { cursor: pointer; }
        `}</style>
      )}

      {/* Create Route Wizard */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create Route — Step {step} of 3
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Driver *</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger><SelectValue placeholder="Choose a driver" /></SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} · {d.vehicle_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDrivers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No available drivers found.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Confirmed Orders</Label>
                <Input
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by order no. or customer..."
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No confirmed orders available.</p>
                ) : (
                  filteredOrders.map(o => (
                    <button
                      key={o.id}
                      className="w-full text-left px-3 py-2 rounded-md border border-border hover:bg-muted/50 text-sm"
                      onClick={() => addStop(o)}
                    >
                      <span className="font-medium">{o.order_no}</span>
                      <span className="text-muted-foreground ml-2">
                        {o.partner_name || o.unregistered_customer_name} — {o.delivery_address}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {stops.length > 0 && (
                <div className="space-y-2">
                  <Label>Stops ({stops.length})</Label>
                  {stops.map((s, i) => (
                    <Card key={s.order_id}>
                      <CardContent className="flex items-center gap-2 py-2 px-3">
                        <span className="font-bold text-sm text-muted-foreground w-6">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.order_no} — {s.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.delivery_address}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStop(i, -1)} disabled={i === 0}>
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1}>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStop(s.order_id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span>{selectedDriverObj?.name} · {selectedDriverObj?.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{routeDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stops</span>
                  <span>{stops.length}</span>
                </div>
              </div>
              <div className="space-y-1">
                {stops.map((s, i) => (
                  <div key={s.order_id} className="flex items-center gap-2 text-sm py-1">
                    <span className="font-bold text-muted-foreground w-6">{i + 1}</span>
                    <span>{s.order_no} — {s.customer_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
            )}
            {step < 3 && (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 1 && (!selectedDriverId || !routeDate)) ||
                  (step === 2 && stops.length === 0)
                }
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleCreateRoute} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Route"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
