import { Badge } from '@vritti/quantum-ui/Badge';
import { lockedTip, PermissionLockIcon, SERVICE_LABELS } from '@vritti/quantum-ui/PermissionGate';
import type { ServiceCode } from '@vritti/quantum-ui/types/catalog-resolver';
import { Wrench } from 'lucide-react';

interface ServiceSetupRequiredProps {
  featureName?: string;
  missingServices: ServiceCode[];
}

// Full-page screen at a service-locked feature's route — the gated feature and what has to be set up
// before it opens. Presentational twin of Upsell: everything it renders comes from the feature payload.
export const ServiceSetupRequired = ({ featureName, missingServices }: ServiceSetupRequiredProps) => (
  <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
    {/* Ambient glow behind the gate */}
    <div className="pointer-events-none absolute top-20 size-64 rounded-full bg-destructive/20 blur-3xl" aria-hidden />

    <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center duration-500 animate-in fade-in slide-in-from-bottom-2">
      {/* Layered lock medallion */}
      <div className="flex size-24 items-center justify-center rounded-full bg-destructive/5 ring-1 ring-destructive/20">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/25">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/20">
            <PermissionLockIcon reason="SERVICE" className="size-6" />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="flex flex-col items-center gap-2">
        <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
          <Wrench className="size-3" />
          Setup required
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight">
          {featureName ? `${featureName} isn't set up yet` : 'Not set up yet'}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {lockedTip({ reason: 'SERVICE', unlockPlans: [], missingServices })} — an administrator has to set it up
          before this can be used.
        </p>
      </div>

      {/* One row per service still to provision */}
      {missingServices.length > 0 && (
        <ul className="flex w-full flex-col gap-2 text-left">
          {missingServices.map((service) => (
            <li
              key={service}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm capitalize"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15">
                <PermissionLockIcon reason="SERVICE" className="size-4" />
              </span>
              {SERVICE_LABELS[service] ?? service}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
