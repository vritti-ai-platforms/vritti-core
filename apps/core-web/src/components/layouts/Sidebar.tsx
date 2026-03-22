import { type SidebarNavGroup, Sidebar as QSidebar } from '@vritti/quantum-ui/Sidebar';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Box, ClipboardList, FileText, Flame, FolderTree, LayoutGrid, Monitor, Package, Receipt, ShoppingCart, Utensils, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../providers/PermissionProvider';

// Maps feature icon strings from the catalog to lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'package': Package,
  'folder-tree': FolderTree,
  'clipboard-list': ClipboardList,
  'monitor': Monitor,
  'flame': Flame,
  'file-text': FileText,
  'chef-hat': Utensils,
  'layout-grid': LayoutGrid,
  'shopping-cart': ShoppingCart,
  'receipt': Receipt,
  'zap': Zap,
};

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
          icon: ICON_MAP[f.icon ?? ''] ?? Box,
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
