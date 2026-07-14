import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useMemo } from 'react';
import { View } from 'react-native';
import { getSelectedWorkspace } from '../../config/storage';
import { usePermissionContext } from '../../providers/PermissionProvider';
import type { HostAppRoute } from '../../routes';
import type {
  ActiveWorkspace,
  AssignedLegalEntity,
  AssignedRole,
  AssignedSite,
  AssignedSiteGroup,
} from '../../types/permissions';

const SITE_TYPE_LABELS: Record<AssignedSite['type'], string> = {
  OUTLET: 'Outlet',
  WAREHOUSE: 'Warehouse',
  PRODUCTION: 'Production',
};

const SectionHead = ({ label, count }: { label: string; count: number }) => (
  <View className="mb-1 mt-4 flex-row items-center gap-2">
    <Text className="text-xs font-bold tracking-widest text-muted-foreground">{label}</Text>
    <Text className="text-xs text-muted-foreground">{count}</Text>
  </View>
);

const RoleLine = ({ roleName }: { roleName: string }) => (
  <Text className="text-xs font-medium text-primary">{roleName}</Text>
);

// Post-login gate that asks which workspace to work in, grouped by scope (sites, groups, companies, org).
export const WorkspaceSelectionScreen = () => {
  const { org, sites, legalEntities, siteGroups, assignments, selectWorkspace } = usePermissionContext();
  const { canPop, pop, push } = usePushNavigator<HostAppRoute>();
  const lastWorkspace = getSelectedWorkspace();

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

  if (assignments.length === 0) {
    return (
      <ScreenContainer scrollable contentContainerStyle={{ gap: 8, padding: 16 }}>
        <Text className="text-base font-semibold text-foreground">No workspaces yet</Text>
        <Text className="text-sm text-muted-foreground">
          You don't have any role assignments. Ask your administrator for access.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ gap: 8, padding: 16 }}>
      <Text className="text-sm text-muted-foreground">Choose the workspace you want to work in.</Text>

      {siteCards.length > 0 && (
        <View className="gap-2">
          <SectionHead label="SITES" count={siteCards.length} />
          {siteCards.map(({ assignment, site }) => {
            const selected = lastWorkspace?.kind === 'site' && lastWorkspace.id === site.id;
            const entity = site.legalEntityId ? leById.get(site.legalEntityId) : undefined;
            const meta = [SITE_TYPE_LABELS[site.type] ?? site.type, site.code, entity?.name]
              .filter(Boolean)
              .join(' · ');
            return (
              <CardPressable
                key={`${assignment.roleCode}-${site.id}`}
                selected={selected}
                onPress={() => handleSelect({ kind: 'site', id: site.id })}
                className="gap-1 p-4"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-base font-semibold text-foreground">{site.name}</Text>
                  <Text className="text-sm text-muted-foreground">{site.currencyCode}</Text>
                </View>
                {meta ? <Text className="text-xs text-muted-foreground">{meta}</Text> : null}
                <RoleLine roleName={assignment.roleName} />
              </CardPressable>
            );
          })}
        </View>
      )}

      {groupCards.length > 0 && (
        <View className="gap-2">
          <SectionHead label="SITE GROUPS" count={groupCards.length} />
          {groupCards.map(({ assignment, group }) => {
            const selected = lastWorkspace?.kind === 'group' && lastWorkspace.id === group.id;
            const members = sites.filter((s) => s.groupId === group.id).length;
            return (
              <CardPressable
                key={`${assignment.roleCode}-${group.id}`}
                selected={selected}
                onPress={() => handleSelect({ kind: 'group', id: group.id })}
                className="gap-1 p-4"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-base font-semibold text-foreground">{group.name}</Text>
                  <Text className="text-sm text-muted-foreground">{group.code}</Text>
                </View>
                <Text className="text-xs text-muted-foreground">
                  Site Group{members > 0 ? ` · ${members} ${members === 1 ? 'site' : 'sites'}` : ''}
                </Text>
                <RoleLine roleName={assignment.roleName} />
              </CardPressable>
            );
          })}
        </View>
      )}

      {leCards.length > 0 && (
        <View className="gap-2">
          <SectionHead label="COMPANIES" count={leCards.length} />
          {leCards.map(({ assignment, entity }) => {
            const selected = lastWorkspace?.kind === 'le' && lastWorkspace.id === entity.id;
            const meta = [entity.country, entity.currencyCode, entity.taxRegime].filter(Boolean).join(' · ');
            return (
              <CardPressable
                key={`${assignment.roleCode}-${entity.id}`}
                selected={selected}
                onPress={() => handleSelect({ kind: 'le', id: entity.id })}
                className="gap-1 p-4"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-base font-semibold text-foreground">{entity.name}</Text>
                  <Text className="text-sm text-muted-foreground">{entity.code}</Text>
                </View>
                {meta ? <Text className="text-xs text-muted-foreground">{meta}</Text> : null}
                <RoleLine roleName={assignment.roleName} />
              </CardPressable>
            );
          })}
        </View>
      )}

      {orgAssignments.length > 0 && org && (
        <View className="gap-2">
          <SectionHead label="ORGANIZATION" count={orgAssignments.length} />
          <CardPressable
            selected={lastWorkspace?.kind === 'org'}
            onPress={() => handleSelect({ kind: 'org', id: org.id })}
            className="gap-1 p-4"
          >
            <Text className="text-base font-semibold text-foreground">Manage {org.name}</Text>
            <Text className="text-xs text-muted-foreground">Companies, structure, members, roles, billing</Text>
            <RoleLine roleName={orgAssignments.map((a) => a.roleName).join(' · ')} />
          </CardPressable>
        </View>
      )}
    </ScreenContainer>
  );
};
