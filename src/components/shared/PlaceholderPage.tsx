import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-xl bg-primary/10 p-4 mb-4">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            This module is under development. Connect your Laravel backend to activate full functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
