import { useState, useEffect } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { MapPickerModal } from "@/components/mpromo/MapPickerModal";
import { getPartnersWithoutGeo, updatePartnerGeolocation } from "@/lib/api/mpromo";
import type { Partner } from "@/types/mpromo";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function MPromoGeoQueue() {
  const [data, setData] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [mapTarget, setMapTarget] = useState<Partner | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getPartnersWithoutGeo({
      page,
      search,
      type: typeFilter !== "all" ? typeFilter : undefined,
    })
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [page, search, typeFilter]);

  const handleCaptureCurrent = (partner: Partner) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updatePartnerGeolocation(partner.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          toast.success(`Location captured for ${partner.name}`);
          setData((d) => d.filter((p) => p.id !== partner.id));
          setTotal((t) => t - 1);
        } catch {
          toast.error("Failed to save location");
        }
      },
      () => toast.error("Unable to get current location")
    );
  };

  const handleMapPick = async (coords: { latitude: number; longitude: number }) => {
    if (!mapTarget) return;
    try {
      await updatePartnerGeolocation(mapTarget.id, coords);
      toast.success(`Location saved for ${mapTarget.name}`);
      setData((d) => d.filter((p) => p.id !== mapTarget.id));
      setTotal((t) => t - 1);
      setMapTarget(null);
    } catch {
      toast.error("Failed to save location");
    }
  };

  const columns: DataTableColumn<Partner>[] = [
    { key: "name", header: "Name" },
    { key: "type", header: "Type", render: (r) => r.type.replace("_", " ") },
    { key: "phone", header: "Phone" },
    { key: "location", header: "Location" },
    { key: "last_activity", header: "Last Activity", render: (r) => r.last_activity || "—" },
    {
      key: "actions",
      header: "",
      className: "w-52",
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCaptureCurrent(r)}>
            <LocateFixed className="h-3 w-3" /> Current
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setMapTarget(r)}>
            <MapPin className="h-3 w-3" /> Map
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
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
        emptyMessage="All partners have locations captured!"
        filters={
          <div className="space-y-1">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CHILLER">Chillers</SelectItem>
                <SelectItem value="ICE_WATER_SELLER">Ice Water Sellers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <MapPickerModal
        open={!!mapTarget}
        onClose={() => setMapTarget(null)}
        onConfirm={handleMapPick}
      />
    </div>
  );
}
