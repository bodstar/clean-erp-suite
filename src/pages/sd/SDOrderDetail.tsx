import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/sd/SourceBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSDOrder, updateSDOrderStatus } from "@/lib/api/sd";
import { toast } from "sonner";
import type { SDOrder } from "@/types/sd";

export default function SDOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SDOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    status: string;
    variant?: "default" | "destructive";
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getSDOrder(Number(id))
      .then(setOrder)
      .catch(() => {
        toast.error("Order not found");
        navigate("/sd/orders");
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleStatusUpdate = async () => {
    if (!order || !confirmAction) return;
    try {
      await updateSDOrderStatus(order.id, confirmAction.status);
      setOrder((prev) => prev ? { ...prev, status: confirmAction.status as SDOrder["status"] } : prev);
      toast.success(`Order ${confirmAction.status}`);
    } catch {
      toast.error("Failed to update order status");
    }
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return null;

  const customerName = order.partner_name || order.unregistered_customer_name || "—";
  const customerPhone = order.partner_phone || order.unregistered_customer_phone || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sd/orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{order.order_no}</h1>
          <StatusBadge status={order.status} />
          <SourceBadge source={order.source} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              {order.partner_id ? (
                <Link to={`/mpromo/partners/${order.partner_id}`} className="text-primary hover:underline">
                  {customerName}
                </Link>
              ) : (
                <span>{customerName}</span>
              )}
              {order.unregistered_customer_id && (
                <span className="ml-1 text-xs text-muted-foreground">(Unregistered)</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Phone: </span>
              {customerPhone}
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Address: </span>
              {order.delivery_address}
            </div>
            {order.scheduled_at && (
              <div>
                <span className="text-muted-foreground">Scheduled: </span>
                {new Date(order.scheduled_at).toLocaleString()}
              </div>
            )}
            {order.delivered_at && (
              <div>
                <span className="text-muted-foreground">Delivered: </span>
                {new Date(order.delivered_at).toLocaleString()}
              </div>
            )}
            {order.driver_name && (
              <div>
                <span className="text-muted-foreground">Driver: </span>
                {order.driver_name}
              </div>
            )}
            {order.notes && (
              <div>
                <span className="text-muted-foreground">Notes: </span>
                {order.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Created by: </span>
              {order.created_by_name}
            </div>
            <div>
              <span className="text-muted-foreground">Created: </span>
              {new Date(order.created_at).toLocaleString()}
            </div>
            <div>
              <span className="text-muted-foreground">Team: </span>
              {order.team_name || "—"}
            </div>
            <div className="pt-2 flex flex-wrap gap-2">
              {order.status === "draft" && (
                <Button
                  size="sm"
                  onClick={() =>
                    setConfirmAction({
                      title: "Confirm Order",
                      description: "This will confirm the order and make it ready for dispatch.",
                      status: "confirmed",
                    })
                  }
                >
                  Confirm Order
                </Button>
              )}
              {order.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setConfirmAction({
                      title: "Cancel Order",
                      description: "Are you sure you want to cancel this order?",
                      status: "cancelled",
                      variant: "destructive",
                    })
                  }
                >
                  Cancel Order
                </Button>
              )}
              {order.status === "in_transit" && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      setConfirmAction({
                        title: "Mark Delivered",
                        description: "Confirm that this order has been successfully delivered.",
                        status: "delivered",
                      })
                    }
                  >
                    Mark Delivered
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setConfirmAction({
                        title: "Mark Failed",
                        description: "Mark this delivery as failed.",
                        status: "failed",
                        variant: "destructive",
                      })
                    }
                  >
                    Mark Failed
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No item details available for this order.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Computed Price</TableHead>
                    <TableHead className="text-right">Charged Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const hasOverride = item.unit_price !== item.computed_unit_price;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.product_sku}</TableCell>
                        <TableCell>{item.unit_of_measure}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">GH₵{item.computed_unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1">
                            GH₵{item.unit_price.toFixed(2)}
                            {hasOverride && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {item.price_override_note || "Price differs from computed amount"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">GH₵{item.line_total.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={6} className="text-right font-semibold">Total</TableCell>
                    <TableCell className="text-right font-bold">GH₵{order.total.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        confirmLabel={confirmAction?.title || "Confirm"}
        variant={confirmAction?.variant || "default"}
        onConfirm={handleStatusUpdate}
      />
    </div>
  );
}
