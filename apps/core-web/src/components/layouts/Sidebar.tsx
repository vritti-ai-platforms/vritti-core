import { groupBy, sortBy, uniqBy } from '@vritti/quantum-ui/lodash';
import { Sidebar as QSidebar, type SidebarNavGroup } from '@vritti/quantum-ui/Sidebar';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Box, Lock } from 'lucide-react';
import { DynamicIcon, type IconName, iconNames } from 'lucide-react/dynamic';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../providers/PermissionProvider';
import type { PermissionFeature } from '../../services/permissions.service';

// Returns a lucide component for a given icon name string, falls back to Box
function resolveIcon(name: string | null): React.ComponentType<{ className?: string }> {
  if (!name || !iconNames.includes(name as IconName)) return Box;
  const iconName = name as IconName;
  return ({ className }: { className?: string }) => <DynamicIcon name={iconName} className={className} />;
}

// A warning lock chip for a plan/BU-locked feature; hover reveals the plans that would unlock it
function LockChip({ feature }: { feature: PermissionFeature }) {
  const tip =
    feature.lockReason === 'BU'
      ? 'Not enabled for this business unit'
      : feature.unlockPlans.length > 0
        ? `Available in ${feature.unlockPlans.join(', ')}`
        : 'Not included in your plan';
  return (
    <Tooltip content={tip} side="right">
      <span className="flex size-4 items-center justify-center rounded bg-warning/15 text-warning">
        <Lock className="size-3" />
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
        // Locked features render greyed + non-navigating with a lock chip (hover shows the unlocking plans)
        disabled: f.locked,
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
