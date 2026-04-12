import { Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SDDrivers() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-xl bg-primary/10 p-4 mb-4">
          <Truck className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground">Driver Management</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Coming in Phase 2. Manage your delivery fleet, assign drivers to orders, and track driver performance.
        </p>
      </CardContent>
    </Card>
  );
}
