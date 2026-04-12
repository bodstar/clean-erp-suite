import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { TeamBadge } from "@/components/shared/TeamBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUnregisteredCustomers, createUnregisteredCustomer } from "@/lib/api/sd";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { useSDScope } from "@/providers/SDScopeProvider";
import type { UnregisteredCustomer } from "@/types/sd";

export default function SDCustomers() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useSDScope();
  const canManage = hasPermission("sd.customers.manage") && scopeMode !== "all";

  const [data, setData] = useState<UnregisteredCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [isCreating, setIsCreating] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    getUnregisteredCustomers({ search: search || undefined }, scope)
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, [search, scope]);

  const handleCreate = async () => {
    if (!form.name || !form.phone) return;
    setIsCreating(true);
    try {
      await createUnregisteredCustomer(form);
      toast.success("Customer added");
      setShowCreate(false);
      setForm({ name: "", phone: "", address: "", notes: "" });
      loadData();
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setIsCreating(false);
    }
  };

  const columns: DataTableColumn<UnregisteredCustomer>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone" },
    { key: "address", header: "Address" },
    ...(scopeMode === "all"
      ? [{
          key: "team_name",
          header: "Team",
          render: (r: UnregisteredCustomer) => r.team_name ? <TeamBadge teamName={r.team_name} /> : "—",
        } as DataTableColumn<UnregisteredCustomer>]
      : []),
    {
      key: "converted",
      header: "Registered",
      render: (r) =>
        r.converted_partner_id ? (
          <Badge variant="outline" className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 text-xs">
            Converted
          </Badge>
        ) : (
          <Link
            to={`/mpromo/partners/new?name=${encodeURIComponent(r.name)}&phone=${encodeURIComponent(r.phone)}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <UserPlus className="h-3 w-3" /> Register
          </Link>
        ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or phone..."
        isLoading={isLoading}
        emptyMessage="No unregistered customers found."
        headerActions={
          canManage ? (
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          ) : undefined
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unregistered Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.name || !form.phone}>
              {isCreating ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
