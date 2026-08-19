import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { OrgServiceDomainRepository } from '@domain/organization/repositories/org-service.repository';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import {
  type AssignmentRoleGrants,
  UserRoleAssignmentDomainRepository,
} from '@domain/user-role/repositories/user-role-assignment.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  type ClientPlatform,
  composeRoleGrants,
  type FeatureUnlocks,
  type PermissionFeature,
  type PlatformBucket,
  resolveUserFeatures,
  type ScopeType,
  SERVICE_CODES,
  type ServiceCode,
  type SiteFeatureLocks,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { Organization, OrgService as OrgServiceEntity, Site, SiteType } from '@/db/schema';
import { templateAppliesAtSite } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';

// External services this org has provisioned — features declaring one stay locked until a row exists.
// The stored codes and the resolver's ServiceCode union are the same vocabulary, kept in step by the
// service_type enum; anything unrecognised is dropped rather than trusted.
function toServiceCodes(rows: OrgServiceEntity[]): ServiceCode[] {
  return rows.map((row) => row.service).filter((code): code is ServiceCode => SERVICE_CODES.includes(code));
}

export interface AssignedSite {
  id: string;
  name: string;
  code: string | null;
  type: SiteType;
  timezone: string;
  currencyCode: string;
  legalEntityId: string | null;
  groupId: string | null;
}

export interface AssignedLegalEntity {
  id: string;
  name: string;
  code: string;
  country: string;
  currencyCode: string;
  taxRegime: string;
  parentId: string | null;
}

export interface AssignedSiteGroup {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

export interface AssignedRole {
  roleCode: string;
  roleName: string;
  targetType: 'SITE' | 'SITE_GROUP' | 'LE' | 'ORG';
  targetId: string | null;
}

export interface AssignedStructure {
  sites: AssignedSite[];
  legalEntities: AssignedLegalEntity[];
  siteGroups: AssignedSiteGroup[];
  assignments: AssignedRole[];
}

// Maps a workspace scope to its permission-code prefix (identity is scope.feature.permission)
const SCOPE_CODE_PREFIX: Record<ScopeType, string> = {
  ORG: 'org',
  LE: 'le',
  SITE_GROUP: 'site-group',
  SITE: 'site',
};

export interface PermissionContext {
  scope: ScopeType;
  id: string;
}

/**
 * Turns grants into an enforceable permission set.
 *
 * Named for users because that is all it resolved at first; it now also resolves app
 * credentials, whose grants live on the app row rather than coming from roles. Both
 * paths converge on the same catalog intersection, so the plan and the node's feature
 * locks bind an app exactly as they bind a person. Renaming the class would touch every
 * injection site for no behavioural gain.
 */
@Injectable()
export class UserPermissionsDomainService {
  private readonly logger = new Logger(UserPermissionsDomainService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly orgServiceRepository: OrgServiceDomainRepository,
    private readonly catalogService: CatalogDomainService,
    private readonly permissionSetCache: PermissionSetCacheService,
  ) {}

  // Resolves the API-enforceable enabled-permission set (granted ∧ not-locked) for a user in a workspace context on a platform
  async resolveEnabledPermissions(
    userId: string,
    ctx: PermissionContext,
    bucket: PlatformBucket = 'web',
  ): Promise<Set<string>> {
    const cached = await this.permissionSetCache.get(userId, ctx, bucket);
    if (cached) return cached;

    // getPermissionsForContext collapses ClientPlatform → bucket internally; 'android' stands in for the mobile bucket
    const { features } = await this.getPermissionsForContext(userId, ctx, bucket === 'web' ? 'web' : 'android');
    const enabled = this.flattenEnabled(features, ctx.scope);

    await this.permissionSetCache.set(userId, ctx, bucket, enabled);
    return enabled;
  }

  /**
   * Resolves the enabled-permission set for an app credential.
   *
   * Deliberately uncached, unlike the user path. Grants arrive with the request that
   * authenticated it, so caching by app id would serve a set built from a grant the
   * caller no longer holds — a revoked permission would keep working until the entry
   * expired. It is also far cheaper to recompute: no role assignments, no nearest-wins
   * chain walk, no template composition — one org read against an already-cached
   * catalog snapshot.
   */
  async resolveAppEnabledPermissions(
    grants: FeatureUnlocks,
    ctx: PermissionContext,
    bucket: PlatformBucket = 'web',
  ): Promise<Set<string>> {
    const features = await this.resolveGrantedFeatures(grants, ctx, bucket);
    return this.flattenEnabled(features, ctx.scope);
  }

  // Resolves the feature codes an app credential may reach — the feature-switch gate, no specific permission
  async resolveAppAvailableFeatures(
    grants: FeatureUnlocks,
    ctx: PermissionContext,
    bucket: PlatformBucket = 'web',
  ): Promise<Set<string>> {
    const features = await this.resolveGrantedFeatures(grants, ctx, bucket);
    return new Set(features.filter((feature) => !feature.locked).map((feature) => feature.code));
  }

  /**
   * Resolves a grant set against the catalog at a workspace context.
   *
   * The app-side counterpart of `resolveScopedFeatures`, minus the role machinery: an app
   * holds one grant set outright, so there is no nearest-wins target selection, no
   * template composition and nothing to merge. What it keeps is everything that
   * constrains the grant — the plan entitlement, the node's feature locks, the site type,
   * and the provisioned services.
   */
  private async resolveGrantedFeatures(
    grants: FeatureUnlocks,
    ctx: PermissionContext,
    bucket: PlatformBucket,
  ): Promise<PermissionFeature[]> {
    const snapshot = await this.catalogService.getActiveSnapshot();
    const node = await this.resolveNodeContext(ctx);

    if (!snapshot || !node.org?.businessCode) {
      this.logger.warn(`No active catalog/entitlement — returning zero features for ${ctx.scope} ${ctx.id}`);
      return [];
    }

    return resolveUserFeatures({
      snapshot,
      businessCode: node.org.businessCode,
      planCode: node.org.planCode ?? undefined,
      siteLocks: node.locks,
      roleFeatures: grants,
      // ClientPlatform, not PlatformBucket: 'android' is how the resolver is told to read the mobile
      // bucket (ios/android share one), while 'app' maps one-to-one since an API client has no variants
      platform: bucket === 'web' ? 'web' : bucket === 'app' ? 'app' : 'android',
      siteType: node.siteType,
      scope: ctx.scope,
      availableServices: await this.getAvailableServices(node.org.id),
    });
  }

  /**
   * The organization and feature locks that apply at a workspace context.
   *
   * Locks live on the node itself — a site, group or legal entity can have a feature
   * switched off independently of any plan — so which row to read depends entirely on the
   * scope being resolved.
   */
  private async resolveNodeContext(
    ctx: PermissionContext,
  ): Promise<{ org: Organization | undefined; locks: SiteFeatureLocks | undefined; siteType?: SiteType }> {
    switch (ctx.scope) {
      case 'SITE': {
        const site = await this.siteRepository.findById(ctx.id);
        if (!site) throw new NotFoundException('Site not found.');
        return {
          org: await this.organizationRepository.findById(site.organizationId),
          locks: site.featureLocks ?? undefined,
          siteType: site.type,
        };
      }
      case 'SITE_GROUP': {
        const group = await this.siteRepository.findSiteGroupById(ctx.id);
        if (!group) throw new ForbiddenException('Site group not found in this organization.');
        return {
          org: await this.organizationRepository.findById(group.organizationId),
          locks: group.featureLocks ?? undefined,
        };
      }
      case 'LE': {
        const legalEntity = await this.siteRepository.findLegalEntityById(ctx.id);
        if (!legalEntity) throw new ForbiddenException('Legal entity not found in this organization.');
        return {
          org: await this.organizationRepository.findById(legalEntity.organizationId),
          locks: legalEntity.featureLocks ?? undefined,
        };
      }
      case 'ORG': {
        const org = await this.organizationRepository.findById(ctx.id);
        if (!org) throw new ForbiddenException('Organization not found.');
        return { org, locks: org.featureLocks ?? undefined };
      }
    }
  }

  /**
   * Flattens resolved features into the dotted codes `@RequirePermission` is written in.
   *
   * Permission identity is scope.feature.permission, so the set carries the requesting
   * context's scope prefix — the same string the frontend gates on (e.g. `org.uom.view`).
   * A locked feature contributes nothing, and a locked permission is dropped from an
   * otherwise unlocked one.
   */
  private flattenEnabled(features: PermissionFeature[], scope: ScopeType): Set<string> {
    const scopePrefix = SCOPE_CODE_PREFIX[scope];
    const enabled = new Set<string>();
    for (const feature of features) {
      if (feature.locked) continue;
      const locked = new Set(feature.lockedPermissions.map((p) => p.code));
      for (const perm of feature.permissions) {
        if (!locked.has(perm)) enabled.add(`${scopePrefix}.${feature.code}.${perm}`);
      }
    }
    return enabled;
  }

  // Resolves the set of feature codes whose switch is on (present ∧ not plan/node-locked) for a user in a workspace context
  async resolveAvailableFeatures(
    userId: string,
    ctx: PermissionContext,
    bucket: PlatformBucket = 'web',
  ): Promise<Set<string>> {
    const { features } = await this.getPermissionsForContext(userId, ctx, bucket === 'web' ? 'web' : 'android');
    const available = new Set<string>();
    for (const feature of features) {
      if (!feature.locked) available.add(feature.code);
    }
    return available;
  }

  // Returns the service codes the organization has provisioned, for gating service-dependent features
  async getAvailableServices(orgId: string): Promise<ServiceCode[]> {
    return toServiceCodes(await this.orgServiceRepository.findByOrg(orgId));
  }

  // Routes feature resolution to the scope-appropriate path for a workspace context. availableServices is
  // threaded in by callers that resolve many nodes for one org, so the lookup happens once, not per node.
  async getPermissionsForContext(
    userId: string,
    ctx: PermissionContext,
    platform: ClientPlatform = 'web',
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    switch (ctx.scope) {
      case 'SITE':
        return this.getPermissions(userId, ctx.id, '', platform, availableServices);
      case 'SITE_GROUP':
        return this.getSiteGroupPermissions(userId, ctx.id, platform, availableServices);
      case 'LE':
        return this.getLegalEntityPermissions(userId, ctx.id, platform, availableServices);
      case 'ORG':
        return this.getOrgPermissions(userId, ctx.id, platform, availableServices);
    }
  }

  // Returns the sites a user can access: direct, via the site's group chain, via its legal entity, or org-wide
  async getAssignedSites(userId: string, orgId: string): Promise<AssignedSite[]> {
    const structure = await this.getAssignedStructure(userId, orgId);
    return structure.sites;
  }

  // Resolves the user's accessible structure — sites plus the legal entities and site groups they touch
  async getAssignedStructure(userId: string, orgId: string): Promise<AssignedStructure> {
    const grants = await this.userRoleAssignmentRepository.findGrantsByUser(userId);
    if (grants.length === 0) return { sites: [], legalEntities: [], siteGroups: [], assignments: [] };

    const [sites, groups, entities, snapshot, org] = await Promise.all([
      this.siteRepository.findByOrg(orgId),
      this.siteRepository.findGroupsByOrg(orgId),
      this.siteRepository.findLegalEntitiesByOrg(orgId),
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(orgId),
    ]);
    const parentMap = new Map(groups.map((g) => [g.id, g.parentId]));
    const currencyByLe = new Map(entities.map((le) => [le.id, le.currencyCode]));

    const assigned: AssignedSite[] = [];
    for (const site of sites) {
      const chain = this.groupChainFromMap(site.groupId, parentMap);
      const typed = this.filterGrantsBySiteType(
        grants,
        snapshot ?? undefined,
        org?.businessCode ?? undefined,
        site.type,
      );
      const applicable = this.selectNearestGrants(typed, site, chain);
      if (applicable.length === 0) continue;
      assigned.push({
        id: site.id,
        name: site.name,
        code: site.code,
        type: site.type,
        timezone: site.timezone,
        currencyCode: (site.legalEntityId && currencyByLe.get(site.legalEntityId)) || '',
        legalEntityId: site.legalEntityId,
        groupId: site.groupId,
      });
    }

    // Relevant LEs = owners of assigned sites ∪ direct LE grants, plus their ancestors so parent chains resolve
    const leById = new Map(entities.map((le) => [le.id, le]));
    const leIds = new Set<string>();
    const addLeWithAncestors = (id: string | null) => {
      let cursor = id;
      let guard = 0;
      while (cursor && !leIds.has(cursor) && guard < 100) {
        leIds.add(cursor);
        cursor = leById.get(cursor)?.parentId ?? null;
        guard += 1;
      }
    };
    for (const site of assigned) addLeWithAncestors(site.legalEntityId);
    for (const grant of grants) addLeWithAncestors(grant.legalEntityId);

    // Relevant groups = chains of assigned sites' groups ∪ chains of direct group grants
    const groupIds = new Set<string>();
    const addGroupChain = (id: string | null) => {
      for (const gid of this.groupChainFromMap(id, parentMap)) groupIds.add(gid);
    };
    for (const site of assigned) addGroupChain(site.groupId);
    for (const grant of grants) addGroupChain(grant.siteGroupId);

    const assignments: AssignedRole[] = grants.map((grant) => ({
      roleCode: grant.code,
      roleName: grant.name,
      targetType: grant.siteId ? 'SITE' : grant.siteGroupId ? 'SITE_GROUP' : grant.legalEntityId ? 'LE' : 'ORG',
      targetId: grant.siteId ?? grant.siteGroupId ?? grant.legalEntityId ?? null,
    }));

    return {
      sites: assigned,
      assignments,
      legalEntities: entities
        .filter((le) => leIds.has(le.id))
        .map((le) => ({
          id: le.id,
          name: le.name,
          code: le.code,
          country: le.country,
          currencyCode: le.currencyCode,
          taxRegime: le.taxRegime,
          parentId: le.parentId,
        })),
      siteGroups: groups
        .filter((g) => groupIds.has(g.id))
        .map((g) => ({ id: g.id, name: g.name, code: g.code, parentId: g.parentId })),
    };
  }

  // Resolves combined features + MF config for a user at a site via api-sdk resolveUserFeatures; no snapshot/entitlement = zero features
  async getPermissions(
    userId: string,
    siteId: string,
    _orgId: string,
    platform: ClientPlatform = 'web',
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    const site = await this.siteRepository.findById(siteId);
    if (!site) throw new NotFoundException('Site not found.');

    // Nearest-wins target selection: site > nearer group > farther group > legal entity > org-wide
    const chain = site.groupId ? await this.siteRepository.findGroupChainIds(site.groupId) : [];
    const grants = await this.userRoleAssignmentRepository.findGrantsByUser(userId);

    const snapshot = await this.catalogService.getActiveSnapshot();
    const org = await this.organizationRepository.findById(site.organizationId);

    // Grants from templates that target another site type are dropped BEFORE nearest-wins, so broader levels can still apply
    const typed = this.filterGrantsBySiteType(grants, snapshot ?? undefined, org?.businessCode ?? undefined, site.type);
    const applicable = this.selectNearestGrants(typed, site, chain);

    // Compose each role's effective grants first: base template (live from the snapshot) ∪ additions − revoked
    const effectiveGrants = applicable.map((a) =>
      this.composeAssignment(a, snapshot ?? undefined, org?.businessCode ?? undefined),
    );

    if (!snapshot || !org?.businessCode) {
      this.logger.warn(`No active catalog/entitlement — returning zero features for site ${siteId}`);
      return { features: [] };
    }

    const features = resolveUserFeatures({
      snapshot,
      businessCode: org.businessCode,
      planCode: org.planCode ?? undefined,
      siteLocks: site.featureLocks ?? undefined,
      roleFeatures: this.mergeRoleGrants(effectiveGrants),
      platform,
      siteType: site.type,
      scope: 'SITE',
      availableServices: availableServices ?? (await this.getAvailableServices(org.id)),
    });

    this.logger.log(`Resolved ${features.length} features for user ${userId} at site ${siteId} (platform=${platform})`);
    return { features };
  }

  // Resolves SITE_GROUP-scoped features for a user at a site group: direct grant > nearest ancestor group > org-wide
  private async getSiteGroupPermissions(
    userId: string,
    siteGroupId: string,
    platform: ClientPlatform,
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    const group = await this.siteRepository.findSiteGroupById(siteGroupId);
    if (!group) throw new ForbiddenException('Site group not found in this organization.');

    const chain = await this.siteRepository.findGroupChainIds(siteGroupId);
    const grants = await this.userRoleAssignmentRepository.findGrantsByUser(userId);
    const applicable = this.selectNearestChainGrants(grants, chain, (g) => g.siteGroupId);

    return this.resolveScopedFeatures(
      userId,
      group.organizationId,
      applicable,
      group.featureLocks ?? undefined,
      'SITE_GROUP',
      platform,
      `site group ${siteGroupId}`,
      undefined,
      availableServices,
    );
  }

  // Resolves LE-scoped features for a user at a legal entity: direct grant > nearest ancestor LE > org-wide
  private async getLegalEntityPermissions(
    userId: string,
    legalEntityId: string,
    platform: ClientPlatform,
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    const legalEntity = await this.siteRepository.findLegalEntityById(legalEntityId);
    if (!legalEntity) throw new ForbiddenException('Legal entity not found in this organization.');

    const entities = await this.siteRepository.findLegalEntitiesByOrg(legalEntity.organizationId);
    const parentMap = new Map(entities.map((le) => [le.id, le.parentId]));
    const chain = this.groupChainFromMap(legalEntityId, parentMap);
    const grants = await this.userRoleAssignmentRepository.findGrantsByUser(userId);
    const applicable = this.selectNearestChainGrants(grants, chain, (g) => g.legalEntityId);

    return this.resolveScopedFeatures(
      userId,
      legalEntity.organizationId,
      applicable,
      legalEntity.featureLocks ?? undefined,
      'LE',
      platform,
      `legal entity ${legalEntityId}`,
      undefined,
      availableServices,
    );
  }

  // Resolves ORG-scoped features for a user in the org workspace from org-wide grants only
  private async getOrgPermissions(
    userId: string,
    orgId: string,
    platform: ClientPlatform,
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new ForbiddenException('Organization not found.');

    const grants = await this.userRoleAssignmentRepository.findGrantsByUser(userId);
    const applicable = grants.filter((g) => !g.siteId && !g.siteGroupId && !g.legalEntityId);

    return this.resolveScopedFeatures(
      userId,
      orgId,
      applicable,
      org.featureLocks ?? undefined,
      'ORG',
      platform,
      `org ${orgId}`,
      org,
      availableServices,
    );
  }

  // Composes applicable grants against the active snapshot and resolves scope-filtered features with the node's locks
  private async resolveScopedFeatures(
    userId: string,
    orgId: string,
    applicable: AssignmentRoleGrants[],
    locks: SiteFeatureLocks | undefined,
    scope: ScopeType,
    platform: ClientPlatform,
    target: string,
    preloadedOrg?: Organization,
    availableServices?: ServiceCode[],
  ): Promise<{ features: PermissionFeature[] }> {
    const snapshot = await this.catalogService.getActiveSnapshot();
    const org = preloadedOrg ?? (await this.organizationRepository.findById(orgId));

    if (!snapshot || !org?.businessCode) {
      this.logger.warn(`No active catalog/entitlement — returning zero features for ${target}`);
      return { features: [] };
    }

    const effectiveGrants = applicable.map((a) => this.composeAssignment(a, snapshot, org.businessCode ?? undefined));

    const features = resolveUserFeatures({
      snapshot,
      businessCode: org.businessCode,
      planCode: org.planCode ?? undefined,
      siteLocks: locks,
      roleFeatures: this.mergeRoleGrants(effectiveGrants),
      platform,
      scope,
      availableServices: availableServices ?? (await this.getAvailableServices(org.id)),
    });

    this.logger.log(`Resolved ${features.length} features for user ${userId} at ${target} (platform=${platform})`);
    return { features };
  }

  // Picks the assignments at the nearest applicable target along a node chain, falling back to org-wide grants
  private selectNearestChainGrants(
    grants: AssignmentRoleGrants[],
    chainIds: string[],
    targetOf: (grant: AssignmentRoleGrants) => string | null,
  ): AssignmentRoleGrants[] {
    for (const id of chainIds) {
      const atNode = grants.filter((g) => targetOf(g) === id);
      if (atNode.length) return atNode;
    }
    return grants.filter((g) => !g.siteId && !g.siteGroupId && !g.legalEntityId);
  }

  // Drops grants whose SITE-scoped template targets a different site type; unknown/custom templates always pass
  private filterGrantsBySiteType(
    grants: AssignmentRoleGrants[],
    snapshot: VersionSnapshot | undefined,
    businessCode: string | undefined,
    siteType: SiteType,
  ): AssignmentRoleGrants[] {
    const templates = snapshot && businessCode ? snapshot.businesses?.[businessCode]?.roleTemplates : undefined;
    if (!templates) return grants;
    return grants.filter((g) => templateAppliesAtSite(templates[g.code], siteType));
  }

  // Picks the assignments at the nearest applicable target level for a site
  private selectNearestGrants(
    grants: AssignmentRoleGrants[],
    site: Pick<Site, 'id' | 'legalEntityId'>,
    groupChainIds: string[],
  ): AssignmentRoleGrants[] {
    const direct = grants.filter((g) => g.siteId === site.id);
    if (direct.length) return direct;

    for (const groupId of groupChainIds) {
      const atGroup = grants.filter((g) => g.siteGroupId === groupId);
      if (atGroup.length) return atGroup;
    }

    if (site.legalEntityId) {
      const atLe = grants.filter((g) => g.legalEntityId === site.legalEntityId);
      if (atLe.length) return atLe;
    }

    return grants.filter((g) => !g.siteId && !g.siteGroupId && !g.legalEntityId);
  }

  // Walks a site's group chain (group + ancestors, nearest first) from a preloaded parent map
  private groupChainFromMap(groupId: string | null, parentMap: Map<string, string | null>): string[] {
    const chain: string[] = [];
    let cursor = groupId;
    let guard = 0;
    while (cursor && guard < 100 && !chain.includes(cursor)) {
      chain.push(cursor);
      cursor = parentMap.get(cursor) ?? null;
      guard += 1;
    }
    return chain;
  }

  // Composes one assignment's effective grants: template (from the active snapshot) ∪ additions − revoked
  private composeAssignment(
    assignment: AssignmentRoleGrants,
    snapshot: VersionSnapshot | undefined,
    businessCode: string | undefined,
  ): FeatureUnlocks {
    const baseFeatures =
      snapshot && businessCode
        ? snapshot.businesses?.[businessCode]?.roleTemplates?.[assignment.code]?.features
        : undefined;
    return composeRoleGrants({
      baseFeatures,
      additions: assignment.features ?? {},
      revoked: assignment.revoked ?? undefined,
    });
  }

  // Merges the effective grants of all assignments additively per feature, per platform bucket
  private mergeRoleGrants(grantSets: FeatureUnlocks[]): FeatureUnlocks {
    const merged: FeatureUnlocks = {};
    for (const features of grantSets) {
      for (const [code, grant] of Object.entries(features)) {
        merged[code] ??= {};
        const entry = merged[code];
        if (grant.web !== undefined) entry.web = [...new Set([...(entry.web ?? []), ...grant.web])];
        if (grant.mobile !== undefined) entry.mobile = [...new Set([...(entry.mobile ?? []), ...grant.mobile])];
      }
    }
    return merged;
  }
}
