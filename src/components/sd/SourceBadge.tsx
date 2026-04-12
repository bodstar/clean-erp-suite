import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SDOrderSource } from "@/types/sd";

const sourceStyles: Record<SDOrderSource, string> = {
  web: "bg-primary/10 text-primary border-primary/30",
  ussd: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  mobile: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  mpromo: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
};

const sourceLabels: Record<SDOrderSource, string> = {
  web: "Web",
  ussd: "USSD",
  mobile: "Mobile",
  mpromo: "M-Promo",
};

interface SourceBadgeProps {
  source: SDOrderSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const style = sourceStyles[source] || "";
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", style, className)}>
      {sourceLabels[source] || source}
    </Badge>
  );
}
