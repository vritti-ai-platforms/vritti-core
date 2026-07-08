import { groupBy, sortBy, uniqBy } from '@vritti/quantum-ui/lodash';
import { lockedTip, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Sidebar as QSidebar, type SidebarNavGroup } from '@vritti/quantum-ui/Sidebar';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
import { Box } from 'lucide-react';
import { DynamicIcon, type IconName, iconNames } from 'lucide-react/dynamic';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../providers/PermissionProvider';

// Returns a lucide component for a given icon name string, falls back to Box
function resolveIcon(name: string | null): React.ComponentType<{ className?: string }> {
  if (!name || !iconNames.includes(name as IconName)) return Box;
  const iconName = name as IconName;
  return ({ className }: { className?: string }) => <DynamicIcon name={iconName} className={className} />;
}

// A lock chip for a locked feature — warning lock + unlocking plans for plan locks, red keyhole for BU locks
function LockChip({ feature }: { feature: PermissionFeature }) {
  const isBuLock = feature.lockReason === 'BU';
  return (
    <Tooltip content={lockedTip({ reason: feature.lockReason, unlockPlans: feature.unlockPlans })} side="right">
      <span
        className={`flex size-4 items-center justify-center rounded ${isBuLock ? 'bg-destructive/15' : 'bg-warning/15'}`}
      >
        <PermissionLockIcon reason={feature.lockReason} className="size-3" />
      </span>
    </Tooltip>
  );
}

// Extracts the bu slug segment from the current URL path
function extractBuSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  return segments.find((s) => s.startsWith('bu-')) ?? null;
}

// Dynamic sidebar built from resolved permission features using quantum-ui Sidebar
export const Sidebar = () => {
  const { features, isLoadingPermissions, selectedBuId } = usePermissionContext();
  const { pathname } = useLocation();
  const buSlug = extractBuSlug(pathname);

  const groups = useMemo<SidebarNavGroup[]>(() => {
    if (!features.length || !buSlug) return [];

    const featuresByApp = groupBy(features, 'appCode');
    const apps = sortBy(uniqBy(features, 'appCode'), 'appSortOrder');

    return apps.map((app) => ({
      label: app.appName,
      items: featuresByApp[app.appCode].map((f) => ({
        title: f.name,
        icon: resolveIcon(f.lucideIcon),
        path: `/${buSlug}/${f.route.routePrefix.replace(/^\//, '')}`,
        // Locked features stay navigable — the route renders an upsell (plan) or gates its actions (BU)
        endAdornment: f.locked ? <LockChip feature={f} /> : undefined,
      })),
    }));
  }, [features, buSlug]);

  if (!selectedBuId || pathname.includes('/pos-billing')) return null;

  if (isLoadingPermissions) {
    return (
      <div className="w-56 flex items-center justify-center border-r border-border">
        <Spinner className="size-5 text-primary" />
      </div>
    );
  }

  return <QSidebar groups={groups} />;
};
