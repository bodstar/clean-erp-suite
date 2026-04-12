import api from "@/lib/api";
import type { Product, ProductCategory, SDOrder, SDOrderSummary, UnregisteredCustomer, SDScope } from "@/types/sd";
import {
  demoProducts,
  demoOrders,
  demoOrderDetails,
  demoUnregisteredCustomers,
  demoCategories,
} from "@/lib/api/sd-demo";

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;

// ─── Scope helpers ───────────────────────────────────────────────────────────

function scopeParams(scope?: SDScope): Record<string, unknown> {
  if (!scope) return {};
  if (scope.mode === "all") return { scope: "all" };
  if (scope.mode === "target" && scope.targetTeamId)
    return { scope: "target", target_team_id: scope.targetTeamId };
  return {};
}

function resolveEffectiveTeamId(scope?: SDScope): { mode: string; currentTeamId: number } {
  const currentTeamId = Number(localStorage.getItem("clean-team-id")) || 1;
  const hasGlobalView = currentTeamId === 1; // HQ only in demo
  if (!hasGlobalView) return { mode: "current", currentTeamId };
  return { mode: scope?.mode ?? "current", currentTeamId };
}

function filterByScope<T extends { team_id?: number | null }>(
  items: T[],
  scope?: SDScope
): T[] {
  const es = resolveEffectiveTeamId(scope);
  if (es.mode === "all") return items;
  if (es.mode === "target" && scope?.targetTeamId)
    return items.filter((i) => i.team_id === scope.targetTeamId);
  return items.filter((i) => i.team_id === es.currentTeamId);
}

// ─── Products ────────────────────────────────────────────────────────────────

export function getCategories(): ProductCategory[] {
  return demoCategories;
}

export async function getProducts(
  params?: Record<string, unknown>,
  scope?: SDScope
): Promise<{ data: Product[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = [...demoProducts];
    if (params?.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    if (params?.category_id) {
      filtered = filtered.filter((p) => p.category_id === Number(params.category_id));
    }
    if (params?.active_only) {
      filtered = filtered.filter((p) => p.is_franchisee_active);
    }
    return { data: filtered, total: filtered.length };
  }
  const res = await api.get("/sd/products", { params: { ...params, ...scopeParams(scope) } });
  return res.data;
}

export async function computeItemPrice(
  productId: number,
  quantity: number,
  _partnerId?: number
): Promise<{ computed_unit_price: number; tier_applied: boolean; loyalty_discount_applied: boolean }> {
  if (DEMO_MODE) {
    const product = demoProducts.find((p) => p.id === productId);
    const base = product?.franchisee_unit_price ?? product?.base_unit_price ?? 0;
    const tier_applied = quantity >= 50;
    const computed_unit_price = tier_applied ? +(base * 0.95).toFixed(2) : base;
    return { computed_unit_price, tier_applied, loyalty_discount_applied: false };
  }
  const res = await api.post("/sd/products/compute-price", {
    product_id: productId,
    quantity,
    partner_id: _partnerId,
  });
  return res.data;
}

// ─── Unregistered Customers ──────────────────────────────────────────────────

export async function getUnregisteredCustomers(
  params?: Record<string, unknown>,
  scope?: SDScope
): Promise<{ data: UnregisteredCustomer[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByScope([...demoUnregisteredCustomers], scope);
    if (params?.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.phone.includes(String(params.search))
      );
    }
    return { data: filtered, total: filtered.length };
  }
  const res = await api.get("/sd/customers", { params: { ...params, ...scopeParams(scope) } });
  return res.data;
}

export async function createUnregisteredCustomer(
  data: Partial<UnregisteredCustomer>
): Promise<UnregisteredCustomer> {
  if (DEMO_MODE) {
    return {
      ...data,
      id: Date.now(),
      team_id: 1,
      created_at: new Date().toISOString(),
    } as UnregisteredCustomer;
  }
  const res = await api.post("/sd/customers", data);
  return res.data;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getSDOrders(
  params?: Record<string, unknown>,
  scope?: SDScope
): Promise<{ data: SDOrderSummary[]; total: number }> {
  if (DEMO_MODE) {
    let filtered = filterByScope([...demoOrders], scope);
    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((o) => o.status === params.status);
    }
    if (params?.source && params.source !== "all") {
      filtered = filtered.filter((o) => o.source === params.source);
    }
    if (params?.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_no.toLowerCase().includes(q) ||
          (o.partner_name ?? "").toLowerCase().includes(q) ||
          (o.unregistered_customer_name ?? "").toLowerCase().includes(q)
      );
    }
    if (params?.date_from) {
      const from = String(params.date_from);
      filtered = filtered.filter((o) => o.created_at.slice(0, 10) >= from);
    }
    if (params?.date_to) {
      const to = String(params.date_to);
      filtered = filtered.filter((o) => o.created_at.slice(0, 10) <= to);
    }
    return { data: filtered, total: filtered.length };
  }
  const res = await api.get("/sd/orders", { params: { ...params, ...scopeParams(scope) } });
  return res.data;
}

export async function getSDOrder(id: number): Promise<SDOrder> {
  if (DEMO_MODE) {
    const detail = demoOrderDetails[id];
    if (detail) return detail;
    const summary = demoOrders.find((o) => o.id === id);
    if (summary) return { ...summary, items: [] } as SDOrder;
    throw new Error("Order not found");
  }
  const res = await api.get(`/sd/orders/${id}`);
  return res.data;
}

export async function createSDOrder(
  data: Partial<SDOrder>,
  scope?: SDScope
): Promise<SDOrder> {
  if (DEMO_MODE) {
    return {
      ...data,
      id: Date.now(),
      order_no: `SD-2026-${String(Date.now()).slice(-5)}`,
      status: "draft",
      source: "web",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as SDOrder;
  }
  const res = await api.post("/sd/orders", data, {
    params: scopeParams(scope),
  });
  return res.data;
}

export async function updateSDOrderStatus(
  id: number,
  status: string,
  notes?: string
): Promise<void> {
  if (DEMO_MODE) return;
  await api.post(`/sd/orders/${id}/status`, { status, notes });
}
