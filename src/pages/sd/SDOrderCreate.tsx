import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getProducts, computeItemPrice, getUnregisteredCustomers, createSDOrder } from "@/lib/api/sd";
import { getPartners } from "@/lib/api/mpromo";
import { toast } from "sonner";
import type { Product, UnregisteredCustomer, SDOrderItem } from "@/types/sd";
import type { Partner } from "@/types/mpromo";
import { useSDScope } from "@/providers/SDScopeProvider";

interface OrderItemDraft {
  product: Product;
  quantity: number;
  computed_unit_price: number;
  unit_price: number;
  tier_applied: boolean;
}

export default function SDOrderCreate() {
  const navigate = useNavigate();
  const { scope } = useSDScope();
  const [step, setStep] = useState(1);

  // Step 1 — Customer
  const [customerType, setCustomerType] = useState<"registered" | "unregistered">("registered");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [unregisteredCustomers, setUnregisteredCustomers] = useState<UnregisteredCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UnregisteredCustomer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" });
  const [useNewCustomer, setUseNewCustomer] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Step 2 — Items
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  // Step 3 — Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load partners or customers
  useEffect(() => {
    if (customerType === "registered") {
      getPartners({ search: partnerSearch, page_size: 20 }, scope).then((res) => setPartners(res.data));
    } else {
      getUnregisteredCustomers({ search: partnerSearch }, scope).then((res) => setUnregisteredCustomers(res.data));
    }
  }, [customerType, partnerSearch, scope]);

  // Load products
  useEffect(() => {
    getProducts({ active_only: true }, scope).then((res) => setProducts(res.data));
  }, [scope]);

  const addItem = (product: Product) => {
    if (items.some((it) => it.product.id === product.id)) return;
    const price = product.franchisee_unit_price ?? product.base_unit_price;
    setItems((prev) => [
      ...prev,
      { product, quantity: 1, computed_unit_price: price, unit_price: price, tier_applied: false },
    ]);
  };

  const updateItemQuantity = useCallback(async (index: number, qty: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
    const item = items[index];
    if (!item) return;
    try {
      const result = await computeItemPrice(
        item.product.id,
        qty,
        selectedPartner?.id
      );
      setItems((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index],
            computed_unit_price: result.computed_unit_price,
            unit_price: result.computed_unit_price,
            tier_applied: result.tier_applied,
          };
        }
        return next;
      });
    } catch { /* ignore */ }
  }, [items, selectedPartner]);

  const updateItemPrice = (index: number, price: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unit_price: price };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

  const canProceedStep1 =
    (customerType === "registered" && selectedPartner) ||
    (customerType === "unregistered" && (selectedCustomer || (useNewCustomer && newCustomer.name && newCustomer.phone)));

  const canProceedStep2 = items.length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const order = await createSDOrder({
        partner_id: selectedPartner?.id,
        partner_name: selectedPartner?.name,
        unregistered_customer_id: selectedCustomer?.id,
        unregistered_customer_name: selectedCustomer?.name || (useNewCustomer ? newCustomer.name : undefined),
        delivery_address: deliveryAddress,
        scheduled_at: scheduledAt || undefined,
        notes: notes || undefined,
        subtotal,
        total: subtotal,
        items: items.map((it, i) => ({
          id: i + 1,
          product_id: it.product.id,
          product_name: it.product.name,
          product_sku: it.product.sku,
          unit_of_measure: it.product.unit_of_measure,
          quantity: it.quantity,
          computed_unit_price: it.computed_unit_price,
          unit_price: it.unit_price,
          line_total: it.quantity * it.unit_price,
          price_override_note: it.unit_price !== it.computed_unit_price ? "Manual price override" : undefined,
        })),
      });
      toast.success(`Order ${order.order_no} created`);
      navigate(`/sd/orders/${order.id}`);
    } catch {
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sd/orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-bold text-foreground">New Order</h1>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 text-sm">
        {["Customer", "Items", "Review"].map((label, i) => (
          <div
            key={label}
            className={`px-3 py-1 rounded-full font-medium ${
              step === i + 1
                ? "bg-primary text-primary-foreground"
                : step > i + 1
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1 — Customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Select Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={customerType === "registered" ? "default" : "outline"}
                size="sm"
                onClick={() => { setCustomerType("registered"); setPartnerSearch(""); }}
              >
                Registered Partner
              </Button>
              <Button
                variant={customerType === "unregistered" ? "default" : "outline"}
                size="sm"
                onClick={() => { setCustomerType("unregistered"); setPartnerSearch(""); }}
              >
                Unregistered Customer
              </Button>
            </div>

            <Input
              placeholder={customerType === "registered" ? "Search partners..." : "Search customers..."}
              value={partnerSearch}
              onChange={(e) => setPartnerSearch(e.target.value)}
            />

            {customerType === "registered" ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPartner(p);
                      setDeliveryAddress(p.location || "");
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-muted ${
                      selectedPartner?.id === p.id ? "bg-primary/10 border border-primary/30" : ""
                    }`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone} • {p.location}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {!useNewCustomer && (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {unregisteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setDeliveryAddress(c.address);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-muted ${
                          selectedCustomer?.id === c.id ? "bg-primary/10 border border-primary/30" : ""
                        }`}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.phone} • {c.address}</div>
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setUseNewCustomer(!useNewCustomer); setSelectedCustomer(null); }}
                >
                  {useNewCustomer ? "Select Existing" : "+ New Customer"}
                </Button>
                {useNewCustomer && (
                  <div className="grid gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={newCustomer.name} onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={newCustomer.phone} onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={newCustomer.address}
                        onChange={(e) => {
                          setNewCustomer((prev) => ({ ...prev, address: e.target.value }));
                          setDeliveryAddress(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Delivery Address</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Items */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Add products</Label>
              <div className="flex flex-wrap gap-2">
                {products
                  .filter((p) => !items.some((it) => it.product.id === p.id))
                  .map((p) => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => addItem(p)} className="gap-1">
                      <Plus className="h-3 w-3" />
                      {p.name} ({p.unit_of_measure})
                    </Button>
                  ))}
              </div>
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.product.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{item.product.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.product.sku}</span>
                        {item.tier_applied && (
                          <span className="text-xs text-[hsl(var(--success))] ml-2">Tier discount applied</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Quantity ({item.product.unit_of_measure})</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(i, Number(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Computed Price (GH₵)</Label>
                        <Input value={item.computed_unit_price.toFixed(2)} disabled />
                      </div>
                      <div>
                        <Label className="text-xs">
                          Charge Price (GH₵)
                          {item.unit_price !== item.computed_unit_price && (
                            <span className="text-[hsl(var(--warning))] ml-1">⚠</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItemPrice(i, Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium">
                      Line Total: GH₵{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                ))}

                <div className="text-right text-lg font-bold">
                  Subtotal: GH₵{subtotal.toFixed(2)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Scheduled Delivery</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Review <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Review Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customer: </span>
                <span className="font-medium">
                  {selectedPartner?.name || selectedCustomer?.name || newCustomer.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Delivery: </span>
                {deliveryAddress}
              </div>
              {scheduledAt && (
                <div>
                  <span className="text-muted-foreground">Scheduled: </span>
                  {new Date(scheduledAt).toLocaleString()}
                </div>
              )}
              {notes && (
                <div>
                  <span className="text-muted-foreground">Notes: </span>
                  {notes}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.product.id} className="flex justify-between text-sm border-b pb-1">
                  <span>
                    {it.product.name} × {it.quantity} {it.product.unit_of_measure}
                  </span>
                  <span className="font-medium">GH₵{(it.quantity * it.unit_price).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total</span>
                <span>GH₵{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
