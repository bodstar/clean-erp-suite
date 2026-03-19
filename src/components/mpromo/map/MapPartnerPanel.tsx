import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Eye, ArrowLeft, GitCompareArrows } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MapPartner } from "@/types/mpromo";

interface MapPartnerPanelProps {
  partners: MapPartner[];
}

export function MapPartnerPanel({ partners }: MapPartnerPanelProps) {
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const comparePartners = partners.filter((p) => compareIds.has(p.id));

  if (partners.length === 0) {
    return (
      <Card className="h-[500px] overflow-auto">
        <CardContent className="p-4 flex items-center justify-center h-full text-sm text-muted-foreground">
          Click a heat circle or drag-select an area to view partners
        </CardContent>
      </Card>
    );
  }

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
          {compareIds.size >= 2 && (
            <Button
              variant="default"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShowCompare(true)}
            >
              <GitCompareArrows className="h-3.5 w-3.5" /> Compare ({compareIds.size})
            </Button>
          )}
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
                    checked={compareIds.has(p.id)}
                    onCheckedChange={() => toggleCompare(p.id)}
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
