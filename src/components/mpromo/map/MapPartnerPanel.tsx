import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Eye, ArrowLeft, GitCompareArrows, MapPin, Phone, Activity, Receipt, ShoppingCart, Wallet, Star, X, ChevronDown, ChevronRight, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportZonesCSV, exportZonesExcel, exportZonesPDF } from "@/lib/export-zone-partners";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MapPartner } from "@/types/mpromo";
import type { AreaZone } from "@/types/area-zone";

interface MapPartnerPanelProps {
  partners: MapPartner[];
  heatmap: boolean;
  areaSelect?: boolean;
  onCompareStateChange?: (isComparing: boolean, comparePartners: MapPartner[]) => void;
  zones?: AreaZone[];
}

/* ─── Single-partner detail card (marker click, heatmap OFF) ─── */
function SinglePartnerView({ partner }: { partner: MapPartner }) {
  return (
    <Card className="h-[500px] overflow-auto">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{partner.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {partner.type.replace("_", " ").toLowerCase()}
          </p>
          <StatusBadge status={partner.status} />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{partner.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{partner.phone}</span>
          </div>
          {partner.last_activity && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span>Last active: {partner.last_activity}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Redemptions", count: partner.redemptions_count, amount: partner.redemptions_amount },
            { label: "Orders", count: partner.orders_count, amount: partner.orders_amount },
            { label: "Pending Payouts", count: partner.pending_payouts_count, amount: partner.pending_payouts_amount },
          ].map((m) => (
            <div key={m.label} className="rounded-md border border-border p-2 space-y-0.5">
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
              <p className="text-xs font-medium">{m.count} · GH₵{m.amount.toLocaleString()}</p>
            </div>
          ))}
          <div className="rounded-md border border-border p-2 space-y-0.5">
            <span className="text-[10px] text-muted-foreground">Loyalty Points</span>
            <p className="text-xs font-medium">{partner.loyalty_points.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link to={`/mpromo/partners/${partner.id}?tab=redemptions`}>
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs">
              <Receipt className="h-3.5 w-3.5" /> Redemptions
            </Button>
          </Link>
          <Link to={`/mpromo/partners/${partner.id}?tab=orders`}>
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs">
              <ShoppingCart className="h-3.5 w-3.5" /> Orders
            </Button>
          </Link>
          <Link to={`/mpromo/partners/${partner.id}?tab=points`}>
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs">
              <Star className="h-3.5 w-3.5" /> Loyalty Pts
            </Button>
          </Link>
          <Link to={`/mpromo/partners/${partner.id}`}>
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs">
              <Wallet className="h-3.5 w-3.5" /> Payouts
            </Button>
          </Link>
        </div>

        <Link to={`/mpromo/partners/${partner.id}`} className="block pt-1">
          <Button variant="default" size="sm" className="w-full h-8 gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" /> View Partner
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/* ─── Main panel ─── */
export function MapPartnerPanel({ partners, heatmap, areaSelect, onCompareStateChange, zones }: MapPartnerPanelProps) {
  const listMode = heatmap || areaSelect;
  const [compareMap, setCompareMap] = useState<Map<number, MapPartner>>(new Map());
  const [showCompare, setShowCompare] = useState(false);
  const comparePartners = Array.from(compareMap.values());

  // Notify parent when compare state changes
  useEffect(() => {
    onCompareStateChange?.(showCompare && comparePartners.length >= 2, comparePartners);
  }, [showCompare, compareMap]);

  const toggleCompare = (partner: MapPartner) => {
    setCompareMap((prev) => {
      const next = new Map(prev);
      if (next.has(partner.id)) next.delete(partner.id);
      else next.set(partner.id, partner);
      return next;
    });
  };

  // Zone-grouped view when advanced selection has zones with partners
  const zonesWithPartners = zones?.filter((z) => z.partners.length > 0) ?? [];
  const hasZoneData = zonesWithPartners.length > 0;

  if (hasZoneData) {
    const allZonePartners = zonesWithPartners.flatMap((z) => z.partners);

    // Compare view across all zones
    if (showCompare && comparePartners.length >= 2) {
      return (
        <Card className="h-[500px] overflow-auto">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setShowCompare(false)}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Comparing {comparePartners.length} partners
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs px-2">Metric</TableHead>
                  {comparePartners.map((p) => (
                    <TableHead key={p.id} className="text-xs px-2">{p.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {([
                  ["Type", (p: MapPartner) => p.type.replace("_", " ")],
                  ["Status", (p: MapPartner) => p.status],
                  ["Location", (p: MapPartner) => p.location],
                  ["Phone", (p: MapPartner) => p.phone],
                  ["Redemptions", (p: MapPartner) => `${p.redemptions_count} · GH₵${p.redemptions_amount.toLocaleString()}`],
                  ["Orders", (p: MapPartner) => `${p.orders_count} · GH₵${p.orders_amount.toLocaleString()}`],
                  ["Payouts", (p: MapPartner) => `${p.pending_payouts_count} · GH₵${p.pending_payouts_amount.toLocaleString()}`],
                  ["Loyalty Pts", (p: MapPartner) => p.loyalty_points.toLocaleString()],
                  ["Last Activity", (p: MapPartner) => p.last_activity || "—"],
                ] as [string, (p: MapPartner) => string][]).map(([label, fn]) => (
                  <TableRow key={label}>
                    <TableCell className="text-xs px-2 font-medium text-muted-foreground">{label}</TableCell>
                    {comparePartners.map((p) => (
                      <TableCell key={p.id} className="text-xs px-2">{fn(p)}</TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="text-xs px-2 font-medium text-muted-foreground">Actions</TableCell>
                  {comparePartners.map((p) => (
                    <TableCell key={p.id} className="text-xs px-2">
                      <Link to={`/mpromo/partners/${p.id}`}>
                        <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]">
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-[500px] overflow-auto">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {allZonePartners.length} partner{allZonePartners.length !== 1 ? "s" : ""} across {zonesWithPartners.length} zone{zonesWithPartners.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              {compareMap.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => setCompareMap(new Map())}
                >
                  <X className="h-3.5 w-3.5" /> Clear ({compareMap.size})
                </Button>
              )}
              {compareMap.size >= 2 && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setShowCompare(true)}
                >
                  <GitCompareArrows className="h-3.5 w-3.5" /> Compare ({compareMap.size})
                </Button>
              )}
            </div>
          </div>

          {zonesWithPartners.map((zone) => (
            <Collapsible key={zone.id} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1.5 px-1 rounded hover:bg-muted/50 transition-colors group">
                <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=closed]:hidden" />
                <ChevronRight className="h-3 w-3 text-muted-foreground group-data-[state=open]:hidden" />
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-xs font-medium">{zone.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {zone.partners.length} partner{zone.partners.length !== 1 ? "s" : ""}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 px-2"></TableHead>
                      <TableHead className="text-xs px-2">Name</TableHead>
                      <TableHead className="text-xs px-2">Type</TableHead>
                      <TableHead className="text-xs px-2">Status</TableHead>
                      <TableHead className="text-xs px-2">Redemptions</TableHead>
                      <TableHead className="text-xs px-2">Orders</TableHead>
                      <TableHead className="text-xs px-2">Payouts</TableHead>
                      <TableHead className="text-xs px-2">Loyalty</TableHead>
                      <TableHead className="text-xs px-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.partners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-2">
                          <Checkbox
                            checked={compareMap.has(p.id)}
                            onCheckedChange={() => toggleCompare(p)}
                          />
                        </TableCell>
                        <TableCell className="text-xs px-2 font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs px-2 capitalize">{p.type.replace("_", " ").toLowerCase()}</TableCell>
                        <TableCell className="text-xs px-2 capitalize">{p.status}</TableCell>
                        <TableCell className="text-xs px-2">
                          {p.redemptions_count} · GH₵{p.redemptions_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs px-2">
                          {p.orders_count} · GH₵{p.orders_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs px-2">
                          {p.pending_payouts_count} · GH₵{p.pending_payouts_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs px-2">{p.loyalty_points.toLocaleString()}</TableCell>
                        <TableCell className="px-2">
                          <Link to={`/mpromo/partners/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (partners.length === 0) {
    return (
      <Card className="h-[500px] overflow-auto">
        <CardContent className="p-4 flex items-center justify-center h-full text-sm text-muted-foreground">
          {listMode
            ? "Click a heat circle or drag-select an area to view partners"
            : "Click a marker to view partner details"}
        </CardContent>
      </Card>
    );
  }

  // List mode OFF → single partner detail card
  if (!listMode) {
    return <SinglePartnerView partner={partners[0]} />;
  }

  // Heatmap ON → tabular view with compare
  if (showCompare && comparePartners.length >= 2) {
    return (
      <Card className="h-[500px] overflow-auto">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShowCompare(false)}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              Comparing {comparePartners.length} partners
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs px-2">Metric</TableHead>
                {comparePartners.map((p) => (
                  <TableHead key={p.id} className="text-xs px-2">{p.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                ["Type", (p: MapPartner) => p.type.replace("_", " ")],
                ["Status", (p: MapPartner) => p.status],
                ["Location", (p: MapPartner) => p.location],
                ["Phone", (p: MapPartner) => p.phone],
                ["Redemptions", (p: MapPartner) => `${p.redemptions_count} · GH₵${p.redemptions_amount.toLocaleString()}`],
                ["Orders", (p: MapPartner) => `${p.orders_count} · GH₵${p.orders_amount.toLocaleString()}`],
                ["Payouts", (p: MapPartner) => `${p.pending_payouts_count} · GH₵${p.pending_payouts_amount.toLocaleString()}`],
                ["Loyalty Pts", (p: MapPartner) => p.loyalty_points.toLocaleString()],
                ["Last Activity", (p: MapPartner) => p.last_activity || "—"],
              ] as [string, (p: MapPartner) => string][]).map(([label, fn]) => (
                <TableRow key={label}>
                  <TableCell className="text-xs px-2 font-medium text-muted-foreground">{label}</TableCell>
                  {comparePartners.map((p) => (
                    <TableCell key={p.id} className="text-xs px-2">{fn(p)}</TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="text-xs px-2 font-medium text-muted-foreground">Actions</TableCell>
                {comparePartners.map((p) => (
                  <TableCell key={p.id} className="text-xs px-2">
                    <Link to={`/mpromo/partners/${p.id}`}>
                      <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]">
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </Link>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] overflow-auto">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {partners.length} partner{partners.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            {compareMap.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setCompareMap(new Map())}
              >
                <X className="h-3.5 w-3.5" /> Clear ({compareMap.size})
              </Button>
            )}
            {compareMap.size >= 2 && (
              <Button
                variant="default"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setShowCompare(true)}
              >
                <GitCompareArrows className="h-3.5 w-3.5" /> Compare ({compareMap.size})
              </Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 px-2"></TableHead>
              <TableHead className="text-xs px-2">Name</TableHead>
              <TableHead className="text-xs px-2">Type</TableHead>
              <TableHead className="text-xs px-2">Status</TableHead>
              <TableHead className="text-xs px-2">Redemptions</TableHead>
              <TableHead className="text-xs px-2">Orders</TableHead>
              <TableHead className="text-xs px-2">Payouts</TableHead>
              <TableHead className="text-xs px-2">Loyalty</TableHead>
              <TableHead className="text-xs px-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="px-2">
                  <Checkbox
                    checked={compareMap.has(p.id)}
                    onCheckedChange={() => toggleCompare(p)}
                  />
                </TableCell>
                <TableCell className="text-xs px-2 font-medium">{p.name}</TableCell>
                <TableCell className="text-xs px-2 capitalize">{p.type.replace("_", " ").toLowerCase()}</TableCell>
                <TableCell className="text-xs px-2 capitalize">{p.status}</TableCell>
                <TableCell className="text-xs px-2">
                  {p.redemptions_count} · GH₵{p.redemptions_amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs px-2">
                  {p.orders_count} · GH₵{p.orders_amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs px-2">
                  {p.pending_payouts_count} · GH₵{p.pending_payouts_amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs px-2">{p.loyalty_points.toLocaleString()}</TableCell>
                <TableCell className="px-2">
                  <Link to={`/mpromo/partners/${p.id}`}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
