import { Breadcrumb } from '@vritti/quantum-ui/Breadcrumb';
import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import {
  Bell,
  Building2,
  ChevronRight,
  Factory,
  Home,
  Landmark,
  type LucideIcon,
  Network,
  Sparkles,
  Store,
  Warehouse,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useLogo } from '../../hooks/useLogo';
import { useOrgLogo } from '../../hooks/useOrgLogo';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissionContext } from '../../providers/PermissionProvider';
import type { WorkspaceKind } from '../../utils/workspace';
import { WORKSPACE_SLUG_PREFIXES } from '../../utils/workspace';
import { RepositorySwitcher } from './switchers/RepositorySwitcher';
import { UserMenu } from './UserMenu';

const KIND_TILES: Record<WorkspaceKind, string> = {
  site: 'bg-success/10 text-success',
  group: 'bg-primary/10 text-primary',
  le: 'bg-warning/10 text-warning',
  org: 'bg-foreground/10 text-foreground',
};

const KIND_ICONS: Record<WorkspaceKind, LucideIcon> = {
  site: Store,
  group: Network,
  le: Landmark,
  org: Building2,
};

// Detail-crumb switchers keyed by the catalog routePrefix that owns them. A remote's detail crumb is inert
// on its own — it links back to the page you are already on — so the host swaps it for a switcher. Future
// features register one line here.
const DETAIL_SWITCHERS: Record<string, ComponentType<{ repoName: string; basePath: string }>> = {
  repositories: RepositorySwitcher,
};

const SITE_TYPE_ICONS: Record<string, LucideIcon> = {
  OUTLET: Store,
  WAREHOUSE: Warehouse,
  PRODUCTION: Factory,
};

export const TopBar = () => {
  const logoImg = useLogo();
  const { org } = useAuth();
  const orgLogo = useOrgLogo();
  const { workspace, sites, legalEntities, siteGroups } = usePermissionContext();

  // Resolves the active workspace's display name + icon from the assigned structure
  const resolveWorkspace = (): { name: string; icon: LucideIcon } | null => {
    if (!workspace) return null;
    if (workspace.kind === 'org') return { name: org?.name ?? 'Organization', icon: KIND_ICONS.org };
    if (workspace.kind === 'site') {
      const site = sites.find((s) => s.id === workspace.id);
      return site ? { name: site.name, icon: SITE_TYPE_ICONS[site.type] ?? Store } : null;
    }
    if (workspace.kind === 'group') {
      const group = siteGroups.find((g) => g.id === workspace.id);
      return group ? { name: group.name, icon: KIND_ICONS.group } : null;
    }
    const entity = legalEntities.find((le) => le.id === workspace.id);
    return entity ? { name: entity.name, icon: KIND_ICONS.le } : null;
  };

  const identity = resolveWorkspace();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-border">
      <div className="h-14 px-4 flex items-center justify-between gap-4">
        {/* Left: home → active workspace identity → feature trail */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {workspace && identity ? (
            <>
              <Link to="/" aria-label="Workspaces" className="group flex items-center shrink-0">
                <Home className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
              <Breadcrumb
                maxItems={4}
                renderSegment={(segment) => {
                  // Feature routes mount at `/:workspaceSlug/<routePrefix>/*`, so a depth of exactly 4 is the
                  // detail segment — deeper ones (a tab, or `actions/:runId`) stay plain crumbs
                  const parts = segment.path.split('/');
                  if (parts.length === 4) {
                    const Switcher = DETAIL_SWITCHERS[parts[2]];
                    if (Switcher) {
                      return (
                        <Switcher key={segment.raw} repoName={segment.raw} basePath={parts.slice(0, 3).join('/')} />
                      );
                    }
                  }

                  const isWorkspace = WORKSPACE_SLUG_PREFIXES.some(({ prefix }) => segment.raw.startsWith(prefix));
                  if (!isWorkspace) return undefined;
                  const Icon = identity.icon;
                  return (
                    <span className="flex items-center gap-2.5 min-w-0">
                      {workspace.kind === 'org' && orgLogo ? (
                        <img src={orgLogo} alt={identity.name} className="size-8 rounded-lg object-contain shrink-0" />
                      ) : (
                        <span
                          className={cn(
                            'flex items-center justify-center size-8 rounded-lg shrink-0',
                            KIND_TILES[workspace.kind],
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                      )}
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold leading-tight text-foreground truncate">
                          {identity.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground leading-tight">Powered by</span>
                          <img src={logoImg} alt="Vritti Core" className="h-2.5 w-auto" />
                        </span>
                      </span>
                    </span>
                  );
                }}
              />
            </>
          ) : (
            <div className="flex items-center px-2">
              <img src={logoImg} alt="Vritti Core" className="h-8" />
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Ask Vritti</span>
          </Button>
          <UserMenu />
        </div>
      </div>
    </div>
  );
};
