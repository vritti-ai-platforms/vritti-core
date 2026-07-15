import { useNavigation } from '@react-navigation/native';
import { Badge } from '@vritti/quantum-ui-native/Badge';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { useLocale, usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { getSelectedWorkspace } from '../../config/storage';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissionContext } from '../../providers/PermissionProvider';
import type { HostAppRoute } from '../../routes';
import type {
  ActiveWorkspace,
  AssignedLegalEntity,
  AssignedRole,
  AssignedSite,
  AssignedSiteGroup,
} from '../../types/permissions';
import { ContinueCard } from './components/ContinueCard';
import { WorkspaceCard } from './components/WorkspaceCard';
import {
  countryFlag,
  currencyLabel,
  firstNameOf,
  formatSiteTime,
  iconForWorkspace,
  plural,
  SCOPE_ACCENTS,
  SCOPE_ICON,
  SITE_TYPE_LABELS,
  timeOfDayGreeting,
} from './utils';

const ACCOUNT_ICON = { sfSymbol: 'person.crop.circle', materialSymbol: 'account_circle' } as const;

// A ticking clock so the per-site local time stays fresh; re-renders on the given interval.
function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const SectionHead = ({ label, count }: { label: string; count?: number }) => (
  <View className="mb-2 mt-2 flex-row items-center gap-3">
    <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Text>
    {count !== undefined ? (
      <View className="rounded-full border border-border bg-card px-2">
        <Text className="text-xs text-muted-foreground">{count}</Text>
      </View>
    ) : null}
    <View className="h-px flex-1 bg-border" />
  </View>
);

const CardTitle = ({ name, code }: { name: string; code?: string | null }) => (
  <View className="flex-row flex-wrap items-baseline gap-x-2">
    <Text className="text-sm font-semibold text-foreground">{name}</Text>
    {code ? <Text className="text-xs text-muted-foreground">{code}</Text> : null}
  </View>
);

// Role chip is always primary-tinted, independent of the card's scope accent (matches web).
const RoleChip = ({ role }: { role: string }) => (
  <Badge variant="outline" className="border-primary/25 bg-primary/10">
    <Text className="font-semibold text-primary">{role}</Text>
  </Badge>
);

const MetaChip = ({ children }: { children: ReactNode }) => (
  <Badge variant="outline">
    <Text className="text-muted-foreground">{children}</Text>
  </Badge>
);

const BadgeRow = ({ children }: { children: ReactNode }) => (
  <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">{children}</View>
);

// Decorative "open" indicator + the site's current local time and timezone (like web).
const StatusLine = ({ time, timezone }: { time: string; timezone: string }) => (
  <View className="mt-1.5 flex-row items-center gap-1.5">
    <View className="h-1.5 w-1.5 rounded-full bg-success" />
    <Text className="text-xs text-muted-foreground">Open</Text>
    <Text className="text-xs text-muted-foreground">{time}</Text>
    <Text numberOfLines={1} className="min-w-0 flex-1 text-xs text-muted-foreground">
      {timezone}
    </Text>
  </View>
);

// Post-login gate that asks which workspace to work in, grouped by scope (sites, groups, companies, org).
export const WorkspaceSelectionScreen = () => {
  const { org, sites, legalEntities, siteGroups, assignments, selectWorkspace } = usePermissionContext();
  const { user } = useAuth();
  const { canPop, pop, push } = usePushNavigator<HostAppRoute>();
  const locale = useLocale();
  const now = useNow(30_000);
  const lastWorkspace = getSelectedWorkspace();
  const navigation = useNavigation();

  // Account button in the native header — opens the Account screen (not otherwise reachable for multi-workspace users).
  useLayoutEffect(() => {
    navigation.setOptions({
      // A plain Pressable (not quantum Button) — the native-stack header subview can't host the Button's
      // native LiquidGlassView, but a core Pressable + DynamicIcon (Image on iOS / glyph on Android) paints reliably.
      headerRight: () => (
        <Pressable onPress={() => push('Account')} accessibilityRole="button" accessibilityLabel="Account" hitSlop={8}>
          <DynamicIcon icon={ACCOUNT_ICON} size={26} className="text-foreground" />
        </Pressable>
      ),
    });
  }, [navigation, push]);

  // Apply the workspace, then slide back to the tabs: pop when pushed over HomeTabs (the switch flow), or
  // navigate to HomeTabs when this is the initial route (fresh login — nothing to pop back to).
  const handleSelect = (workspace: ActiveWorkspace) => {
    selectWorkspace(workspace);
    if (canPop) pop();
    else push('HomeTabs');
  };

  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);
  const groupById = useMemo(() => new Map(siteGroups.map((g) => [g.id, g])), [siteGroups]);
  const leById = useMemo(() => new Map(legalEntities.map((le) => [le.id, le])), [legalEntities]);

  const siteCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'SITE')
        .map((assignment) => ({
          assignment,
          site: assignment.targetId ? siteById.get(assignment.targetId) : undefined,
        }))
        .filter((c): c is { assignment: AssignedRole; site: AssignedSite } => !!c.site),
    [assignments, siteById],
  );

  const groupCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'SITE_GROUP')
        .map((assignment) => ({
          assignment,
          group: assignment.targetId ? groupById.get(assignment.targetId) : undefined,
        }))
        .filter((c): c is { assignment: AssignedRole; group: AssignedSiteGroup } => !!c.group),
    [assignments, groupById],
  );

  const leCards = useMemo(
    () =>
      assignments
        .filter((a) => a.targetType === 'LE')
        .map((assignment) => ({
          assignment,
          entity: assignment.targetId ? leById.get(assignment.targetId) : undefined,
        }))
        .filter((c): c is { assignment: AssignedRole; entity: AssignedLegalEntity } => !!c.entity),
    [assignments, leById],
  );

  const orgAssignments = useMemo(() => assignments.filter((a) => a.targetType === 'ORG'), [assignments]);

  const hasSites = siteCards.length > 0;
  const hasGroups = groupCards.length > 0;
  const hasLes = leCards.length > 0;
  const hasOrg = orgAssignments.length > 0 && !!org;
  const kindCount = [hasSites, hasGroups, hasLes, hasOrg].filter(Boolean).length;

  const lede =
    kindCount > 1
      ? 'Where are you working today?'
      : hasSites
        ? 'Pick your site'
        : hasGroups
          ? 'Pick a site group'
          : hasLes
            ? 'Pick a company'
            : 'Your workspace';

  const summary = [
    hasSites ? plural(siteCards.length, 'site') : null,
    hasGroups ? plural(groupCards.length, 'site group') : null,
    hasLes ? plural(leCards.length, 'company', 'companies') : null,
    hasOrg ? 'organization' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const first = firstNameOf(user?.fullName);
  const greeting = `${timeOfDayGreeting(now.getHours())}${first ? `, ${first.toUpperCase()}` : ''}`;

  // Resolve the last-used workspace into a Continue card (any kind — mobile persists all kinds).
  const continueEntry = useMemo(() => {
    if (!lastWorkspace || assignments.length < 2) return null;
    const roleOf = (targetType: AssignedRole['targetType'], id: string | null) =>
      assignments.find((a) => a.targetType === targetType && a.targetId === id)?.roleName;
    const { kind, id } = lastWorkspace;
    if (kind === 'site') {
      const s = id ? siteById.get(id) : undefined;
      if (!s) return null;
      return {
        icon: iconForWorkspace('site', s.type),
        name: s.name,
        role: roleOf('SITE', s.id),
        workspace: { kind, id: s.id },
      };
    }
    if (kind === 'group') {
      const g = id ? groupById.get(id) : undefined;
      if (!g) return null;
      return {
        icon: SCOPE_ICON.group,
        name: g.name,
        role: roleOf('SITE_GROUP', g.id),
        workspace: { kind, id: g.id },
      };
    }
    if (kind === 'le') {
      const e = id ? leById.get(id) : undefined;
      if (!e) return null;
      return { icon: SCOPE_ICON.le, name: e.name, role: roleOf('LE', e.id), workspace: { kind, id: e.id } };
    }
    if (!org) return null;
    const role = orgAssignments.map((a) => a.roleName).join(' · ');
    return {
      icon: SCOPE_ICON.org,
      name: org.name,
      role: role || undefined,
      workspace: { kind: 'org' as const, id: org.id },
    };
  }, [lastWorkspace, assignments, siteById, groupById, leById, org, orgAssignments]);

  if (assignments.length === 0) {
    return (
      <ScreenContainer scrollable contentContainerClassName="flex-1 items-center justify-center gap-3 p-6">
        <DynamicIcon icon={SCOPE_ICON.org} size={40} className="text-muted-foreground" />
        <Text className="text-base font-semibold text-foreground">No workspaces yet</Text>
        <Text className="text-center text-sm text-muted-foreground">
          You don't have any role assignments. Ask your administrator for access.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-3 px-4 pb-10 pt-2">
      <View className="items-center gap-1 pb-2 pt-2">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{greeting}</Text>
        <Text className="text-center text-2xl font-bold text-foreground">{lede}</Text>
        {summary ? <Text className="text-sm text-muted-foreground">{summary}</Text> : null}
      </View>

      {continueEntry ? (
        <ContinueCard
          icon={continueEntry.icon}
          name={continueEntry.name}
          role={continueEntry.role}
          onPress={() => handleSelect(continueEntry.workspace)}
        />
      ) : null}

      {hasSites ? (
        <View className="gap-3">
          <SectionHead label="Sites" count={siteCards.length} />
          {siteCards.map(({ assignment, site }, index) => {
            const entity = site.legalEntityId ? leById.get(site.legalEntityId) : undefined;
            return (
              <WorkspaceCard
                key={`${assignment.roleCode}-${site.id}`}
                accent={SCOPE_ACCENTS.site}
                icon={iconForWorkspace('site', site.type)}
                index={index}
                onPress={() => handleSelect({ kind: 'site', id: site.id })}
              >
                <CardTitle name={site.name} code={site.code} />
                <BadgeRow>
                  <Badge variant="success">
                    <Text>{SITE_TYPE_LABELS[site.type]}</Text>
                  </Badge>
                  {entity ? (
                    <MetaChip>{`${entity.name} · ${currencyLabel(site.currencyCode, locale)}`}</MetaChip>
                  ) : null}
                  <RoleChip role={assignment.roleName} />
                </BadgeRow>
                <StatusLine time={formatSiteTime(now, site.timezone, locale)} timezone={site.timezone} />
              </WorkspaceCard>
            );
          })}
        </View>
      ) : null}

      {hasGroups ? (
        <View className="gap-3">
          <SectionHead label="Site Groups" count={groupCards.length} />
          {groupCards.map(({ assignment, group }, index) => {
            const memberSites = sites.filter((s) => s.groupId === group.id);
            const covers = memberSites.length
              ? `covers ${memberSites
                  .slice(0, 2)
                  .map((s) => s.name)
                  .join(', ')}${memberSites.length > 2 ? ` +${memberSites.length - 2}` : ''}`
              : null;
            const companyCount = new Set(memberSites.map((s) => s.legalEntityId).filter(Boolean)).size;
            return (
              <WorkspaceCard
                key={`${assignment.roleCode}-${group.id}`}
                accent={SCOPE_ACCENTS.group}
                icon={SCOPE_ICON.group}
                index={index}
                onPress={() => handleSelect({ kind: 'group', id: group.id })}
              >
                <CardTitle name={group.name} code={group.code} />
                <BadgeRow>
                  <Badge variant="outline" className="border-primary/25 bg-primary/10">
                    <Text className="font-semibold text-primary">Site Group</Text>
                  </Badge>
                  {covers ? <MetaChip>{covers}</MetaChip> : null}
                  <RoleChip role={assignment.roleName} />
                </BadgeRow>
                {memberSites.length ? (
                  <Text className="mt-1.5 text-xs text-muted-foreground">
                    {`${plural(memberSites.length, 'site')} · ${plural(companyCount, 'company', 'companies')}`}
                  </Text>
                ) : null}
              </WorkspaceCard>
            );
          })}
        </View>
      ) : null}

      {hasLes ? (
        <View className="gap-3">
          <SectionHead label="Companies" count={leCards.length} />
          {leCards.map(({ assignment, entity }, index) => {
            const flag = countryFlag(entity.country);
            return (
              <WorkspaceCard
                key={`${assignment.roleCode}-${entity.id}`}
                accent={SCOPE_ACCENTS.le}
                icon={SCOPE_ICON.le}
                index={index}
                onPress={() => handleSelect({ kind: 'le', id: entity.id })}
              >
                <CardTitle name={entity.name} code={entity.code} />
                <BadgeRow>
                  <Badge variant="warning">
                    <Text>Company</Text>
                  </Badge>
                  <MetaChip>
                    {`${flag ? `${flag} ` : ''}${entity.country} · ${currencyLabel(entity.currencyCode, locale)} · ${entity.taxRegime}`}
                  </MetaChip>
                  {entity.parentId ? <MetaChip>Subsidiary</MetaChip> : null}
                  <RoleChip role={assignment.roleName} />
                </BadgeRow>
              </WorkspaceCard>
            );
          })}
        </View>
      ) : null}

      {hasOrg && org ? (
        <View className="gap-3">
          <SectionHead label="Organization" />
          <WorkspaceCard
            accent={SCOPE_ACCENTS.org}
            icon={SCOPE_ICON.org}
            index={0}
            onPress={() => handleSelect({ kind: 'org', id: org.id })}
          >
            <CardTitle name={`Manage ${org.name}`} />
            <Text className="mt-0.5 text-xs text-muted-foreground">Companies, structure, members, roles, billing</Text>
            <BadgeRow>
              <RoleChip role={orgAssignments.map((a) => a.roleName).join(' · ')} />
              {legalEntities.length ? (
                <MetaChip>{plural(legalEntities.length, 'company', 'companies')}</MetaChip>
              ) : null}
              {siteGroups.length ? <MetaChip>{plural(siteGroups.length, 'group')}</MetaChip> : null}
              {sites.length ? <MetaChip>{plural(sites.length, 'site')}</MetaChip> : null}
            </BadgeRow>
          </WorkspaceCard>
        </View>
      ) : null}
    </ScreenContainer>
  );
};
