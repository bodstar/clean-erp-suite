import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { getPartners } from "@/lib/api/mpromo";
import type { Partner, PartnerType } from "@/types/mpromo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Ban, CheckCircle, MapPin } from "lucide-react";

export default function MPromoPartners() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useMPromoScope();
  const canManage = hasPermission("mpromo.partners.manage") && scopeMode !== "all";

  const [partnerType, setPartnerType] = useState<PartnerType>("CHILLER");
  const [data, setData] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [geoMissing, setGeoMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getPartners({ type: partnerType, page, search, geo_missing: geoMissing || undefined }, scope)
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [partnerType, page, search, geoMissing, scope]);

  const columns: DataTableColumn<Partner>[] = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "location", header: "Location" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "last_activity", header: "Last Activity", render: (row) => row.last_activity || "—" },
    {
      key: "geo",
      header: "Geo",
      render: (row) =>
        row.latitude ? (
          <MapPin className="h-4 w-4 text-[hsl(var(--success))]" />
        ) : (
          <span className="text-xs text-muted-foreground">Missing</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/mpromo/partners/${row.id}`)}>
              <Eye className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/mpromo/partners/${row.id}`)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {row.status === "active" ? (
                    <><Ban className="h-4 w-4 mr-2" /> Suspend</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={partnerType} onValueChange={(v) => { setPartnerType(v as PartnerType); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="CHILLER">Chillers</TabsTrigger>
          <TabsTrigger value="ICE_WATER_SELLER">Ice Water Sellers</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search partners..."
        isLoading={isLoading}
        emptyMessage="No partners found."
        filters={
          <div className="flex items-center gap-2">
            <Switch id="geo-missing" checked={geoMissing} onCheckedChange={setGeoMissing} />
            <Label htmlFor="geo-missing" className="text-xs">Location missing</Label>
          </div>
        }
        headerActions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/mpromo/partners/new")}>
                <Plus className="h-4 w-4" /> Add Partner
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
