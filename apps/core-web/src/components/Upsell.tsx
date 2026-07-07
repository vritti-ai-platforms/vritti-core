import { Badge } from '@vritti/quantum-ui/Badge';
import { Card } from '@vritti/quantum-ui/Card';
import { lockedTip, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type { PlanUpsell } from '@vritti/quantum-ui/types/catalog-resolver';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';

interface UpsellProps {
  featureName?: string;
  unlockPlans: string[];
  // Per unlocking plan, the extra features that plan adds vs the current plan (resolved server-side)
  upsell: PlanUpsell[];
}

// Full-page screen shown at a plan-locked feature's route — reframed as an aspirational unlock: the
// gated feature, the plans that lift it, and the extra features each plan adds (no price).
export const Upsell = ({ featureName, unlockPlans, upsell }: UpsellProps) => {
  const groups = upsell.filter((group) => group.features.length > 0);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Ambient glow behind the gate */}
      <div className="pointer-events-none absolute top-20 size-64 rounded-full bg-warning/20 blur-3xl" aria-hidden />

      <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center duration-500 animate-in fade-in slide-in-from-bottom-2">
        {/* Layered lock medallion */}
        <div className="flex size-24 items-center justify-center rounded-full bg-warning/5 ring-1 ring-warning/20">
          <div className="flex size-16 items-center justify-center rounded-full bg-warning/10 ring-1 ring-warning/25">
            <div className="flex size-11 items-center justify-center rounded-full bg-warning/20">
              <PermissionLockIcon reason="PLAN" className="size-6" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-2">
          <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
            <Sparkles className="size-3" />
            Plan upgrade
          </Badge>
          <h1 className="text-xl font-semibold tracking-tight">
            {featureName ? `Unlock ${featureName}` : 'Unlock this feature'}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">{lockedTip({ reason: 'PLAN', unlockPlans })}</p>
        </div>

        {/* One card per unlocking plan — the aspirational "what you step up to" */}
        {groups.length > 0 && (
          <div className="flex w-full flex-col gap-3 text-left">
            {groups.map((group) => (
              <Card key={group.plan} className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ArrowUpRight className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">Upgrade to {group.plan}</span>
                    <span className="text-xs text-muted-foreground">
                      Unlocks {group.features.length} more {group.features.length === 1 ? 'feature' : 'features'}
                    </span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2 p-4">
                  {group.features.map((name) => (
                    <li key={name} className="flex items-center gap-2 text-sm">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                        <Check className="size-3 text-success" />
                      </span>
                      {name}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
