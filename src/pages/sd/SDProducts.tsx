import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { getProducts, getCategories } from "@/lib/api/sd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/providers/AuthProvider";
import { useSDScope } from "@/providers/SDScopeProvider";
import type { Product } from "@/types/sd";

const demoPriceTiers: Record<number, { min_qty: number; max_qty?: number; unit_price: number; valid_from?: string; valid_until?: string }[]> = {
  1: [
    { min_qty: 1, max_qty: 49, unit_price: 5.50, valid_from: "2026-01-01", valid_until: "2026-12-31" },
    { min_qty: 50, max_qty: 199, unit_price: 5.23, valid_from: "2026-01-01", valid_until: "2026-12-31" },
    { min_qty: 200, unit_price: 4.95, valid_from: "2026-01-01" },
  ],
};

export default function SDProducts() {
  const { hasPermission } = useAuth();
  const { scope, scopeMode } = useSDScope();
  const canManage = hasPermission("sd.products.manage") && scopeMode !== "all";

  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = getCategories();

  useEffect(() => {
    setIsLoading(true);
    getProducts({
      search: search || undefined,
      category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
    }, scope)
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [search, categoryFilter, scope]);

  const columns: DataTableColumn<Product>[] = [
    { key: "sku", header: "SKU" },
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <button
          onClick={() => setSelectedProduct(r)}
          className="text-primary hover:underline font-medium text-left"
        >
          {r.name}
        </button>
      ),
    },
    { key: "category_name", header: "Category" },
    { key: "unit_of_measure", header: "Unit" },
    {
      key: "base_unit_price",
      header: "Base Price",
      render: (r) => `GH₵${r.base_unit_price.toFixed(2)}`,
    },
    {
      key: "franchisee_unit_price",
      header: "Your Price",
      render: (r) => r.franchisee_unit_price ? `GH₵${r.franchisee_unit_price.toFixed(2)}` : "—",
    },
    {
      key: "is_franchisee_active",
      header: "Active",
      render: (r) => (
        <span className={r.is_franchisee_active ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>
          {r.is_franchisee_active ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  const tiers = selectedProduct ? demoPriceTiers[selectedProduct.id] : undefined;

  const addButton = canManage ? (
    <Button size="sm" className="gap-1.5">
      <Plus className="h-4 w-4" />
      Add Product
    </Button>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button size="sm" className="gap-1.5" disabled>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Only HQ can manage products</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or SKU..."
        isLoading={isLoading}
        emptyMessage="No products found."
        filters={
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        headerActions={addButton}
      />

      <Sheet open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProduct?.name}</SheetTitle>
          </SheetHeader>

          {selectedProduct && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">SKU</p>
                  <p className="font-medium">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Category</p>
                  <p className="font-medium">{selectedProduct.category_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Unit of Measure</p>
                  <p className="font-medium">{selectedProduct.unit_of_measure}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Active</p>
                  <p className="font-medium">{selectedProduct.is_franchisee_active ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Base Price</p>
                  <p className="font-medium">GH₵{selectedProduct.base_unit_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Your Price</p>
                  <p className="font-medium">
                    {selectedProduct.franchisee_unit_price
                      ? `GH₵${selectedProduct.franchisee_unit_price.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Price Tiers</h3>
                {tiers && tiers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Min Qty</TableHead>
                        <TableHead>Max Qty</TableHead>
                        <TableHead>Unit Price (GH₵)</TableHead>
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid Until</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{t.min_qty}</TableCell>
                          <TableCell>{t.max_qty ?? "∞"}</TableCell>
                          <TableCell>{t.unit_price.toFixed(2)}</TableCell>
                          <TableCell>{t.valid_from ?? "—"}</TableCell>
                          <TableCell>{t.valid_until ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No price tiers configured</p>
                )}
              </div>

              <SheetClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
