import { Badge } from "@/components/ui/badge";

interface TeamBadgeProps {
  teamName?: string | null;
  className?: string;
}

export function TeamBadge({ teamName, className }: TeamBadgeProps) {
  if (!teamName) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="secondary" className={className}>
      {teamName}
    </Badge>
  );
}
