import { useState, useEffect } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { getProducts, getCategories } from "@/lib/api/sd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types/sd";

export default function SDProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const categories = getCategories();

  useEffect(() => {
    setIsLoading(true);
    getProducts({
      search: search || undefined,
      category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
    })
      .then((res) => { setData(res.data); setTotal(res.total); })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setIsLoading(false));
  }, [search, categoryFilter]);

  const columns: DataTableColumn<Product>[] = [
    { key: "sku", header: "SKU" },
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
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

  return (
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
          <SelectTrigger className="w-[160px]">
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
    />
  );
}
