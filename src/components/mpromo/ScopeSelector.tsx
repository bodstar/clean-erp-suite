import { Globe, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/AuthProvider";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import type { ScopeMode } from "@/types/mpromo";

export function ScopeSelector() {
  const { hasPermission, teams } = useAuth();
  const { scopeMode, targetTeamId, setScopeMode, setTargetTeamId } = useMPromoScope();

  const canViewAll = hasPermission("mpromo.hq.global_view");
  const canActOnTeam = hasPermission("mpromo.hq.run_campaigns_any_team");

  if (!canViewAll && !canActOnTeam) return null;

  const modes: { value: ScopeMode; label: string; icon: React.ReactNode; show: boolean }[] = [
    { value: "current", label: "Current Team", icon: <Building2 className="h-4 w-4" />, show: true },
    { value: "all", label: "All Teams", icon: <Globe className="h-4 w-4" />, show: canViewAll },
    { value: "target", label: "Act on Team", icon: <Users className="h-4 w-4" />, show: canActOnTeam },
  ];

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <span className="text-xs font-medium text-muted-foreground mr-1">Scope:</span>
      <div className="flex gap-1">
        {modes.filter((m) => m.show).map((m) => (
          <Button
            key={m.value}
            variant={scopeMode === m.value ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setScopeMode(m.value)}
          >
            {m.icon}
            {m.label}
          </Button>
        ))}
      </div>
      {scopeMode === "target" && (
        <Select
          value={targetTeamId ? String(targetTeamId) : ""}
          onValueChange={(v) => setTargetTeamId(Number(v))}
        >
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="Select team..." />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {scopeMode === "all" && (
        <span className="text-xs text-muted-foreground italic">Read-only aggregated view</span>
      )}
    </div>
  );
}
