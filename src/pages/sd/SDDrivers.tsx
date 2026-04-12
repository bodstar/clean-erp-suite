import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { useSDScope } from "@/providers/SDScopeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getDrivers, createDriver, updateDriver, toggleDriverAvailability } from "@/lib/api/sd";
import { toast } from "sonner";
import type { SDDriver } from "@/types/sd";

export default function SDDrivers() {
  const { scope, canUseGlobalScope } = useSDScope();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sd.drivers.manage");

  const [data, setData] = useState<SDDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<SDDriver | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLicense, setFormLicense] = useState("");
  const [formVehicleType, setFormVehicleType] = useState("Motorbike");
  const [formPlate, setFormPlate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlate, setEditPlate] = useState("");

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDrivers(
        { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined },
        scope
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load drivers");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, scope]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const handleCreate = async () => {
    if (!formName.trim() || !formPhone.trim()) return;
    setIsSubmitting(true);
    try {
      const driver = await createDriver({
        name: formName, phone: formPhone, license_no: formLicense,
        vehicle_type: formVehicleType, vehicle_plate: formPlate,
      });
      setData(prev => [driver, ...prev]);
      setTotal(prev => prev + 1);
      setShowCreateForm(false);
      resetCreateForm();
      toast.success("Driver added");
    } catch {
      toast.error("Failed to add driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormName(""); setFormPhone(""); setFormLicense("");
    setFormVehicleType("Motorbike"); setFormPlate("");
  };

  const handleToggleAvailability = async (driver: SDDriver) => {
    try {
      await toggleDriverAvailability(driver.id);
      const newAvailable = !driver.is_available;
      const newStatus = newAvailable
        ? (driver.active_route_id ? "on_delivery" : "available")
        : "off_duty";
      setData(prev => prev.map(d =>
        d.id === driver.id ? { ...d, is_available: newAvailable, status: newStatus } : d
      ));
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver(prev => prev ? { ...prev, is_available: newAvailable, status: newStatus } : prev);
      }
      toast.success(newAvailable ? "Driver marked available" : "Driver marked off duty");
    } catch {
      toast.error("Failed to toggle availability");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDriver) return;
    setIsSubmitting(true);
    try {
      const updated = await updateDriver(selectedDriver.id, {
        name: editName, phone: editPhone, vehicle_plate: editPlate,
      });
      setData(prev => prev.map(d => d.id === updated.id ? updated : d));
      setSelectedDriver(updated);
      setIsEditing(false);
      toast.success("Driver updated");
    } catch {
      toast.error("Failed to update driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (driver: SDDriver) => {
    setSelectedDriver(driver);
    setIsEditing(false);
    setEditName(driver.name);
    setEditPhone(driver.phone);
    setEditPlate(driver.vehicle_plate);
  };

  const columns: DataTableColumn<SDDriver>[] = [
    {
      key: "name", header: "Name",
      render: (row) => (
        <button
          className="text-primary hover:underline font-medium text-left"
          onClick={() => openDetail(row)}
        >
          {row.name}
        </button>
      ),
    },
    { key: "phone", header: "Phone" },
    { key: "vehicle_type", header: "Vehicle" },
    { key: "vehicle_plate", header: "Plate" },
    {
      key: "status", header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "availability", header: "Available",
      render: (row) => (
        <Button
          variant={row.is_available ? "default" : "outline"}
          size="sm"
          className="gap-1 h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); handleToggleAvailability(row); }}
        >
          <Power className="h-3 w-3" />
          {row.is_available ? "On" : "Off"}
        </Button>
      ),
    },
    ...(canUseGlobalScope ? [{
      key: "team_name" as const, header: "Team",
      render: (row: SDDriver) => <TeamBadge teamName={row.team_name} />,
    }] : []),
  ];

  const addButton = canManage ? (
    <Button size="sm" className="gap-1.5" onClick={() => setShowCreateForm(true)}>
      <Plus className="h-4 w-4" /> Add Driver
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Only HQ can manage drivers</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search drivers..."
        emptyMessage="No drivers found."
        headerActions={addButton}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_delivery">On Delivery</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="0244123456" />
            </div>
            <div className="space-y-2">
              <Label>License No.</Label>
              <Input value={formLicense} onChange={e => setFormLicense(e.target.value)} placeholder="GH-DL-XXXX-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={formVehicleType} onValueChange={setFormVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorbike">Motorbike</SelectItem>
                  <SelectItem value="Pickup Truck">Pickup Truck</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Plate</Label>
              <Input value={formPlate} onChange={e => setFormPlate(e.target.value)} placeholder="GR-1234-21" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !formName.trim() || !formPhone.trim()}>
              {isSubmitting ? "Adding..." : "Add Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!selectedDriver} onOpenChange={open => !open && setSelectedDriver(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDriver?.name}</SheetTitle>
          </SheetHeader>
          {selectedDriver && (
            <div className="mt-6 space-y-6">
              {!isEditing ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selectedDriver.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License</span>
                      <span>{selectedDriver.license_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span>{selectedDriver.vehicle_type} · {selectedDriver.vehicle_plate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge status={selectedDriver.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Seen</span>
                      <span>
                        {selectedDriver.last_location_at
                          ? new Date(selectedDriver.last_location_at).toLocaleString()
                          : "Location unknown"}
                      </span>
                    </div>
                    {selectedDriver.active_route_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Route</span>
                        <Link
                          to={`/sd/routes/${selectedDriver.active_route_id}`}
                          className="text-primary hover:underline"
                          onClick={() => setSelectedDriver(null)}
                        >
                          Route #{selectedDriver.active_route_id}
                        </Link>
                      </div>
                    )}
                    {selectedDriver.team_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Team</span>
                        <TeamBadge teamName={selectedDriver.team_name} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    )}
                    <Button
                      variant={selectedDriver.is_available ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleAvailability(selectedDriver)}
                    >
                      <Power className="h-3.5 w-3.5 mr-1" />
                      {selectedDriver.is_available ? "Set Off Duty" : "Set Available"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Plate</Label>
                    <Input value={editPlate} onChange={e => setEditPlate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
