import { type SidebarNavGroup, Sidebar as QSidebar } from '@vritti/quantum-ui/Sidebar';
import { Spinner } from '@vritti/quantum-ui/Spinner';
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

    return [
      {
        label: 'Features',
        items: features.map((f) => ({
          title: f.name,
          icon: resolveIcon(f.icon),
          path: `/${buSlug}/${f.route.routePrefix.replace(/^\//, '')}`,
        })),
      },
    ];
  }, [features, buSlug]);

  if (!selectedBuId) return null;

  if (isLoadingPermissions) {
    return (
      <div className="w-56 flex items-center justify-center border-r border-border">
        <Spinner className="size-5 text-primary" />
      </div>
    );
  }

  return <QSidebar groups={groups} />;
};
