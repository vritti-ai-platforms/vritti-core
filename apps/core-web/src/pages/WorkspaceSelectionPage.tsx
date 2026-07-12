import type {
  AssignedLegalEntity,
  AssignedRole,
  AssignedSite,
  AssignedSiteGroup,
  SiteType,
} from '@services/permissions.service';
import { workspacePath } from '@utils/workspace';
import { cn } from '@vritti/quantum-ui/cn';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Building2, ChevronRight, Factory, Landmark, type LucideIcon, Network, Store, Warehouse } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { LAST_SITE_STORAGE_KEY, usePermissionContext } from '../providers/PermissionProvider';

type Scope = 'site' | 'group' | 'le' | 'org';

interface ScopeAccent {
  rail: string;
  tile: string;
  kind: string;
  hover: string;
  text: string;
}

const SCOPE_ACCENTS: Record<Scope, ScopeAccent> = {
  site: {
    rail: 'bg-success',
    tile: 'bg-success/10 text-success',
    kind: 'bg-success/10 text-success border-success/25',
    hover: 'hover:border-success/40 hover:shadow-success/15',
    text: 'text-success',
  },
  group: {
    rail: 'bg-primary',
    tile: 'bg-primary/10 text-primary',
    kind: 'bg-primary/10 text-primary border-primary/25',
    hover: 'hover:border-primary/40 hover:shadow-primary/15',
    text: 'text-primary',
  },
  le: {
    rail: 'bg-warning',
    tile: 'bg-warning/10 text-warning',
    kind: 'bg-warning/10 text-warning border-warning/25',
    hover: 'hover:border-warning/40 hover:shadow-warning/15',
    text: 'text-warning',
  },
  org: {
    rail: 'bg-foreground',
    tile: 'bg-foreground/10 text-foreground',
    kind: 'bg-foreground/10 text-foreground border-foreground/25',
    hover: 'hover:border-foreground/30 hover:shadow-foreground/10',
    text: 'text-foreground',
  },
};

const SITE_TYPE_ICONS: Record<SiteType, LucideIcon> = {
  OUTLET: Store,
  WAREHOUSE: Warehouse,
  PRODUCTION: Factory,
};

const SITE_TYPE_LABELS: Record<SiteType, string> = {
  OUTLET: 'Outlet',
  WAREHOUSE: 'Warehouse',
  PRODUCTION: 'Production',
};

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function currencyLabel(code: string): string {
  try {
    const symbol = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value;
    return symbol && symbol !== code ? `${symbol} ${code}` : code;
  } catch {
    return code;
  }
}

function countryFlag(country: string): string {
  if (!/^[A-Za-z]{2}$/.test(country)) return '';
  return String.fromCodePoint(...[...country.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function formatSiteTime(now: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(now);
  } catch {
    return '–:–';
  }
}

const Chip = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground',
      className,
    )}
  >
    {children}
  </span>
);

const SectionHead = ({ label, count }: { label: string; count?: number }) => (
  <div className="mb-3 flex items-center gap-3">
    <h3 className="whitespace-nowrap text-xs font-bold tracking-widest text-muted-foreground">{label}</h3>
    {count !== undefined && (
      <span className="rounded-full border border-border bg-card px-2 font-mono text-xs text-muted-foreground">
        {count}
      </span>
    )}
    <div className="h-px flex-1 bg-border" />
  </div>
);

interface WorkspaceCardProps {
  scope: Scope;
  icon: LucideIcon;
  watermark: LucideIcon;
  index: number;
  onClick: () => void;
  children: React.ReactNode;
}

const WorkspaceCard = ({ scope, icon: Icon, watermark: Watermark, index, onClick, children }: WorkspaceCardProps) => {
  const accent = SCOPE_ACCENTS[scope];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        'ws-reveal group relative flex w-full cursor-pointer gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        accent.hover,
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1 opacity-75 transition-all duration-200 group-hover:w-1.5 group-hover:opacity-100',
          accent.rail,
        )}
      />
      <Watermark
        strokeWidth={1.4}
        className={cn(
          'pointer-events-none absolute -bottom-6 -right-5 size-30 opacity-5 transition-all duration-300 group-hover:-rotate-3 group-hover:opacity-10',
          accent.text,
        )}
      />
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accent.tile)}>
        <Icon className="size-4.5" />
      </span>
      <span className="relative min-w-0 flex-1 pr-5">{children}</span>
      <ChevronRight
        strokeWidth={2.4}
        className={cn(
          'absolute right-3 top-1/2 size-4 -translate-x-1 -translate-y-1/2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100',
          accent.text,
        )}
      />
    </button>
  );
};

const CardTitle = ({ name, code }: { name: string; code?: string | null }) => (
  <span className="flex flex-wrap items-baseline gap-2">
    <span className="text-sm font-semibold text-foreground">{name}</span>
    {code && <span className="font-mono text-xs text-muted-foreground">{code}</span>}
  </span>
);

const RoleChip = ({ roleName }: { roleName: string }) => (
  <Chip className="border-primary/25 bg-primary/10 font-semibold text-primary">{roleName}</Chip>
);

export const WorkspaceSelectionPage = () => {
  const { sites, legalEntities, siteGroups, assignments, isLoadingSites, selectSite, selectWorkspace } =
    usePermissionContext();
  const { user, org } = useAuth();
  const navigate = useNavigate();
  const now = useNow(30000);

  const openSite = useCallback(
    (site: AssignedSite) => {
      selectSite(site.id);
      navigate(workspacePath('site', site.name, site.id), { replace: true });
    },
    [selectSite, navigate],
  );

  const openGroup = useCallback(
    (group: AssignedSiteGroup) => {
      selectWorkspace({ kind: 'group', id: group.id });
      navigate(workspacePath('group', group.name, group.id));
    },
    [selectWorkspace, navigate],
  );

  const openLegalEntity = useCallback(
    (entity: AssignedLegalEntity) => {
      selectWorkspace({ kind: 'le', id: entity.id });
      navigate(workspacePath('le', entity.name, entity.id));
    },
    [selectWorkspace, navigate],
  );

  const openOrg = useCallback(() => {
    if (!org) return;
    selectWorkspace({ kind: 'org', id: org.id });
    navigate(workspacePath('org', org.name, org.id));
  }, [selectWorkspace, navigate, org]);

  const siteCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'SITE')
        .map((assignment) => ({ assignment, site: sites.find((s) => s.id === assignment.targetId) }))
        .filter((c): c is { assignment: AssignedRole; site: AssignedSite } => !!c.site),
    [assignments, sites],
  );

  const groupCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'SITE_GROUP')
        .map((assignment) => ({ assignment, group: siteGroups.find((g) => g.id === assignment.targetId) }))
        .filter((c): c is { assignment: AssignedRole; group: AssignedSiteGroup } => !!c.group),
    [assignments, siteGroups],
  );

  const leCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'LE')
        .map((assignment) => ({ assignment, entity: legalEntities.find((le) => le.id === assignment.targetId) }))
        .filter((c): c is { assignment: AssignedRole; entity: AssignedLegalEntity } => !!c.entity),
    [assignments, legalEntities],
  );

  const orgAssignments = useMemo(() => assignments.filter((a) => a.targetType === 'ORG'), [assignments]);

  const leById = useMemo(() => new Map(legalEntities.map((le) => [le.id, le])), [legalEntities]);

  // Auto-continue: a single assignment targeting a site skips this page entirely
  const autoContinueSite =
    !isLoadingSites && assignments.length === 1 && assignments[0].targetType === 'SITE'
      ? (sites.find((s) => s.id === assignments[0].targetId) ?? null)
      : null;

  useEffect(() => {
    if (autoContinueSite) openSite(autoContinueSite);
  }, [autoContinueSite, openSite]);

  const lastSite = useMemo(() => {
    const storedId = localStorage.getItem(LAST_SITE_STORAGE_KEY);
    if (!storedId) return null;
    return sites.find((s) => s.id === storedId) ?? null;
  }, [sites]);

  const showHero = !!lastSite && assignments.length >= 2;

  useEffect(() => {
    if (!showHero || !lastSite) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') openSite(lastSite);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHero, lastSite, openSite]);

  if (isLoadingSites) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (autoContinueSite) {
    return (
      <div className="workspace-canvas -mt-6 flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-24 text-center">
        <Spinner className="mb-4 size-8 text-primary" />
        <h1 className="font-plex-serif text-lg font-semibold">Opening {autoContinueSite.name}…</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">One workspace — no selection needed.</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="workspace-canvas -mt-6 flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-24 text-center">
        <Building2 className="mb-4 size-9 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="font-plex-serif text-lg font-semibold">No workspaces yet</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          You don't have any role assignments. Ask your administrator for access.
        </p>
      </div>
    );
  }

  const firstName = (user?.displayName ?? user?.fullName ?? '').trim().split(/\s+/)[0] ?? '';
  const greeting = `${timeOfDayGreeting()}${firstName ? `, ${firstName.toUpperCase()}` : ''}`;

  const hasSites = siteCards.length > 0;
  const hasGroups = groupCards.length > 0;
  const hasLes = leCards.length > 0;
  const hasOrg = orgAssignments.length > 0;
  const kindCount = [hasSites, hasGroups, hasLes, hasOrg].filter(Boolean).length;

  const lede =
    kindCount > 1
      ? 'Where are you working today?'
      : hasSites
        ? 'Pick your site'
        : hasLes
          ? 'Pick a company'
          : hasGroups
            ? 'Pick a site group'
            : 'Your workspace';

  const subtitle =
    kindCount === 1 && hasSites
      ? `You work at ${plural(siteCards.length, 'site')}.`
      : kindCount === 1 && hasLes
        ? `You keep the books of ${plural(leCards.length, 'company', 'companies')}.`
        : [
            hasSites ? plural(siteCards.length, 'site') : null,
            hasGroups ? plural(groupCards.length, 'site group') : null,
            hasLes ? plural(leCards.length, 'company', 'companies') : null,
            hasOrg ? 'organization' : null,
          ]
            .filter(Boolean)
            .join(' · ');

  const lastSiteRole = lastSite
    ? assignments.find((a) => a.targetType === 'SITE' && a.targetId === lastSite.id)?.roleName
    : undefined;

  return (
    <div className="workspace-canvas -mt-6 min-h-[calc(100dvh-3.5rem)] rounded-2xl px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground">{greeting}</p>
          <h1 className="font-plex-serif mt-2 text-2xl font-semibold tracking-tight">{lede}</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {showHero && lastSite && (
          <button
            type="button"
            onClick={() => openSite(lastSite)}
            className="ws-reveal group mx-auto mb-8 flex w-full max-w-xl cursor-pointer items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                CONTINUE WHERE YOU LEFT OFF
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold">{lastSite.name}</span>
              {lastSiteRole && <span className="mt-0.5 block text-xs text-muted-foreground">{lastSiteRole}</span>}
            </span>
            <span className="ml-auto shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30">
              Open&nbsp;↵
            </span>
          </button>
        )}

        {hasSites && (
          <section className="mt-6">
            <SectionHead label="SITES" count={siteCards.length} />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {siteCards.map(({ assignment, site }, index) => {
                const Icon = SITE_TYPE_ICONS[site.type] ?? Store;
                const entity = site.legalEntityId ? leById.get(site.legalEntityId) : undefined;
                return (
                  <WorkspaceCard
                    key={`${assignment.roleCode}-${site.id}`}
                    scope="site"
                    icon={Icon}
                    watermark={Icon}
                    index={index}
                    onClick={() => openSite(site)}
                  >
                    <CardTitle name={site.name} code={site.code} />
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Chip className={SCOPE_ACCENTS.site.kind}>{SITE_TYPE_LABELS[site.type] ?? site.type}</Chip>
                      {entity && (
                        <Chip>
                          {entity.name} · {currencyLabel(site.currencyCode)}
                        </Chip>
                      )}
                      <RoleChip roleName={assignment.roleName} />
                    </span>
                    <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-success" />
                        Open
                      </span>
                      <span className="font-mono tabular-nums">{formatSiteTime(now, site.timezone)}</span>
                      <span className="truncate">{site.timezone}</span>
                    </span>
                  </WorkspaceCard>
                );
              })}
            </div>
          </section>
        )}

        {hasGroups && (
          <section className="mt-6">
            <SectionHead label="SITE GROUPS" count={groupCards.length} />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {groupCards.map(({ assignment, group }, index) => {
                const members = sites.filter((s) => s.groupId === group.id);
                const names = members.map((m) => m.name);
                const covers =
                  names.length > 0
                    ? `covers ${names.slice(0, 2).join(' + ')}${names.length > 2 ? ` +${names.length - 2}` : ''}`
                    : null;
                const companyCount = new Set(members.map((m) => m.legalEntityId).filter(Boolean)).size;
                return (
                  <WorkspaceCard
                    key={`${assignment.roleCode}-${group.id}`}
                    scope="group"
                    icon={Network}
                    watermark={Network}
                    index={index}
                    onClick={() => openGroup(group)}
                  >
                    <CardTitle name={group.name} code={group.code} />
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Chip className={SCOPE_ACCENTS.group.kind}>Site Group</Chip>
                      {covers && <Chip>{covers}</Chip>}
                      <RoleChip roleName={assignment.roleName} />
                    </span>
                    {members.length > 0 && (
                      <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {plural(members.length, 'site')} · {plural(companyCount, 'company', 'companies')}
                      </span>
                    )}
                  </WorkspaceCard>
                );
              })}
            </div>
          </section>
        )}

        {hasLes && (
          <section className="mt-6">
            <SectionHead label="COMPANIES" count={leCards.length} />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {leCards.map(({ assignment, entity }, index) => (
                <WorkspaceCard
                  key={`${assignment.roleCode}-${entity.id}`}
                  scope="le"
                  icon={Landmark}
                  watermark={Landmark}
                  index={index}
                  onClick={() => openLegalEntity(entity)}
                >
                  <CardTitle name={entity.name} code={entity.code} />
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <Chip className={SCOPE_ACCENTS.le.kind}>Company</Chip>
                    <Chip>
                      {countryFlag(entity.country)} {entity.country} · {currencyLabel(entity.currencyCode)} ·{' '}
                      {entity.taxRegime}
                    </Chip>
                    {entity.parentId && <Chip>Subsidiary</Chip>}
                    <RoleChip roleName={assignment.roleName} />
                  </span>
                </WorkspaceCard>
              ))}
            </div>
          </section>
        )}

        {hasOrg && org && (
          <section className="mt-6">
            <SectionHead label="ORGANIZATION" />
            <button
              type="button"
              onClick={openOrg}
              className="ws-reveal group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-border bg-muted/60 px-4 py-3.5 pl-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-foreground opacity-60 transition-all duration-200 group-hover:w-1.5" />
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
                <Building2 className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Manage {org.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  Companies, structure, members, roles, billing
                  <RoleChip roleName={orgAssignments.map((a) => a.roleName).join(' · ')} />
                </span>
              </span>
              <span className="ml-auto hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex">
                {legalEntities.length > 0 && <Chip>{plural(legalEntities.length, 'company', 'companies')}</Chip>}
                {siteGroups.length > 0 && <Chip>{plural(siteGroups.length, 'group')}</Chip>}
                {sites.length > 0 && <Chip>{plural(sites.length, 'site')}</Chip>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
