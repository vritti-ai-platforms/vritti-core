import { Breadcrumb, BreadcrumbLink } from '@vritti/quantum-ui/Breadcrumb';
import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import { parseSlug } from '@vritti/quantum-ui/slug';
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
import { type ComponentType, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLogo } from '../../hooks/useLogo';
import { useOrgLogo } from '../../hooks/useOrgLogo';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissionContext } from '../../providers/PermissionProvider';
import type { WorkspaceKind } from '../../utils/workspace';
import { isUuid, workspaceKindOf } from '../../utils/workspace';
import { InventoryItemSwitcher } from './switchers/InventoryItemSwitcher';
import { OfferingSwitcher } from './switchers/OfferingSwitcher';
import { PaymentTermSwitcher } from './switchers/PaymentTermSwitcher';
import { RepositorySwitcher } from './switchers/RepositorySwitcher';
import { SmsProviderSwitcher } from './switchers/SmsProviderSwitcher';
import { SupplierItemSwitcher } from './switchers/SupplierItemSwitcher';
import { SupplierSiteSwitcher } from './switchers/SupplierSiteSwitcher';
import { SupplierSwitcher } from './switchers/SupplierSwitcher';
import { VariantSwitcher } from './switchers/VariantSwitcher';
import { WhatsappAccountSwitcher } from './switchers/WhatsappAccountSwitcher';
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
const DETAIL_SWITCHERS: Record<string, ComponentType<{ segment: string; basePath: string }>> = {
  repositories: RepositorySwitcher,
  'whatsapp-accounts': WhatsappAccountSwitcher,
  'sms-providers': SmsProviderSwitcher,
  offerings: OfferingSwitcher,
  suppliers: SupplierSwitcher,
  'payment-terms': PaymentTermSwitcher,
  'inventory-items': InventoryItemSwitcher,
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

  // An id segment reads as its entity's name — the workspace root (`/<kind>/<uuid>`, its word hidden) and bare
  // ids inside a feature (`…/suppliers/<supplier>/<siteId>`)
  const { pathname } = useLocation();
  const entityLabels = useMemo(() => {
    const nameOf = (id: string): string | undefined =>
      (org?.id === id ? org.name : undefined) ??
      sites.find((s) => s.id === id)?.name ??
      siteGroups.find((g) => g.id === id)?.name ??
      legalEntities.find((le) => le.id === id)?.name;
    const segments = pathname.split('/').filter(Boolean);
    const labels: Record<string, string> = {};
    segments.forEach((segment, index) => {
      if (!isUuid(segment)) return;
      const name = nameOf(segment);
      if (name) labels[`/${segments.slice(0, index + 1).join('/')}`] = name;
    });
    return labels;
  }, [pathname, sites, siteGroups, legalEntities, org]);

  const renderWorkspaceIdentity = () => {
    if (!workspace || !identity) return undefined;
    const Icon = identity.icon;
    return (
      <span className="flex items-center gap-2.5 min-w-0">
        {workspace.kind === 'org' && orgLogo ? (
          <img src={orgLogo} alt={identity.name} className="size-8 rounded-lg object-contain shrink-0" />
        ) : (
          <span
            className={cn('flex items-center justify-center size-8 rounded-lg shrink-0', KIND_TILES[workspace.kind])}
          >
            <Icon className="size-4" />
          </span>
        )}
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-semibold leading-tight text-foreground truncate">{identity.name}</span>
          <span className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground leading-tight">Powered by</span>
            <img src={logoImg} alt="VAP" className="h-2.5 w-auto" />
          </span>
        </span>
      </span>
    );
  };

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
                routes={entityLabels}
                hideSegment={(segment, index, all) =>
                  !!workspaceKindOf(segment.raw) && !!all[index + 1] && isUuid(all[index + 1].raw)
                }
                renderSegment={(segment) => {
                  // Workspaces mount at `/<kind>/<id>`, features at `/<kind>/<id>/<routePrefix>/*`
                  const parts = segment.path.split('/');
                  if (parts.length === 3 && workspaceKindOf(parts[1]) && isUuid(segment.raw)) {
                    return renderWorkspaceIdentity();
                  }
                  // An LE supplier's site view — `/<kind>/<id>/suppliers/<supplier>/<siteId>` — reads `Sites › <site>`:
                  // the URL has no sites segment, so the crumb back to the supplier's Sites tab is drawn here, and the
                  // site switches between those the supplier is enrolled at (its id comes from the crumb above)
                  if (parts.length === 6 && parts[3] === 'suppliers' && isUuid(segment.raw)) {
                    const supplier = parseSlug(parts[4]);
                    if (supplier) {
                      const supplierPath = parts.slice(0, 5).join('/');
                      return (
                        <span className="flex items-center gap-1.5">
                          <BreadcrumbLink asChild>
                            <Link to={`${supplierPath}/sites`}>Sites</Link>
                          </BreadcrumbLink>
                          <ChevronRight className="size-3.5" aria-hidden />
                          <SupplierSiteSwitcher
                            key={segment.raw}
                            siteId={segment.raw}
                            supplierId={supplier.id}
                            basePath={supplierPath}
                            fallbackLabel={entityLabels[segment.path] ?? segment.label}
                          />
                        </span>
                      );
                    }
                  }

                  // A static child route sits at the same depth as a detail id — `/variants/generate`
                  // reads as a variant slug otherwise, and the switcher queries for an id of "generate"
                  if (!parseSlug(segment.raw)) return undefined;

                  // A depth of exactly 5 is the feature's detail segment — deeper ones stay plain crumbs
                  if (parts.length === 5) {
                    const Switcher = DETAIL_SWITCHERS[parts[3]];
                    if (Switcher) {
                      return (
                        <Switcher key={segment.raw} segment={segment.raw} basePath={parts.slice(0, 4).join('/')} />
                      );
                    }
                  }

                  // An LE supplier's item view — `/le/<id>/suppliers/<supplier>/<item>/<tab>` — reads `Items › <item>`:
                  // the URL has no items segment, so the crumb back to the supplier's Items tab is drawn here, and the
                  // item's own crumb is a switcher since its bare URL only redirects back to its Overview
                  if (parts.length === 6 && parts[1] === 'le' && parts[3] === 'suppliers') {
                    const supplier = parseSlug(parts[4]);
                    if (supplier) {
                      const supplierPath = parts.slice(0, 5).join('/');
                      return (
                        <span className="flex items-center gap-1.5">
                          <BreadcrumbLink asChild>
                            <Link to={`${supplierPath}/items`}>Items</Link>
                          </BreadcrumbLink>
                          <ChevronRight className="size-3.5" aria-hidden />
                          <SupplierItemSwitcher
                            key={segment.raw}
                            segment={segment.raw}
                            supplierId={supplier.id}
                            basePath={supplierPath}
                            tab={pathname.split('/')[6]}
                          />
                        </span>
                      );
                    }
                  }

                  // A variant sits two levels deeper — `/<kind>/<id>/offerings/<offering>/variants/<variant>` —
                  // and its options are scoped by the offering above it, so it takes the parent's id
                  if (parts.length === 7 && parts[3] === 'offerings' && parts[5] === 'variants') {
                    const parent = parseSlug(parts[4]);
                    if (!parent) return undefined;
                    return (
                      <VariantSwitcher
                        key={segment.raw}
                        segment={segment.raw}
                        offeringId={parent.id}
                        basePath={parts.slice(0, 6).join('/')}
                      />
                    );
                  }

                  return undefined;
                }}
              />
            </>
          ) : (
            <div className="flex items-center px-2">
              <img src={logoImg} alt="VAP" className="h-8" />
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
