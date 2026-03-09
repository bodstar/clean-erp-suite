import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart, Receipt } from "lucide-react";
import type { MapPartner } from "@/types/mpromo";

interface MapPartnerPanelProps {
  partner: MapPartner | null;
}

export function MapPartnerPanel({ partner }: MapPartnerPanelProps) {
  return (
    <Card className="h-[500px] overflow-auto">
      <CardContent className="p-4">
        {partner ? (
          <div className="space-y-3">
            <h3 className="font-bold text-foreground">{partner.name}</h3>
            <p className="text-xs text-muted-foreground">
              {partner.type.replace("_", " ")} · {partner.phone}
            </p>
            <p className="text-xs text-muted-foreground">{partner.location}</p>
            <p className="text-xs">
              Status: <span className="capitalize font-medium">{partner.status}</span>
            </p>
            <p className="text-xs">Last Activity: {partner.last_activity || "—"}</p>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redemptions</span>
                <span>
                  {partner.redemptions_count} · GH₵
                  {partner.redemptions_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span>
                  {partner.orders_count} · GH₵{partner.orders_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Payouts</span>
                <span>
                  {partner.pending_payouts_count} · GH₵
                  {partner.pending_payouts_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3 flex flex-col gap-2">
              <Link to={`/mpromo/partners/${partner.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> View Partner
                </Button>
              </Link>
              <Link to={`/mpromo/partners/${partner.id}?tab=orders`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <ShoppingCart className="h-3.5 w-3.5" /> View Orders
                </Button>
              </Link>
              <Link to={`/mpromo/partners/${partner.id}?tab=redemptions`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <Receipt className="h-3.5 w-3.5" /> View Redemptions
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Click a marker to view partner details
          </div>
        )}
      </CardContent>
    </Card>
  );
}
