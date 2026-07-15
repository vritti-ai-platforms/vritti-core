import {
  buildDependsMap,
  cascadeLocked,
  type FeatureUnlocks,
  filterGrantedByDeps,
  findFeatureByCode,
  PLATFORMS,
  type PlatformDenyCodes,
  type SiteFeatureLocks,
  type SiteType,
  type SnapshotRoleTemplate,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';
import { BadRequestException } from '@vritti/api-sdk/exceptions';

// Rejects role grants that enable a dependent permission without its prerequisite (per feature, per platform)
export function validateGrantDependencies(features: FeatureUnlocks, snapshot: VersionSnapshot): void {
  for (const [featureCode, platforms] of Object.entries(features)) {
    // Grants key features by bare code (scope-agnostic); the permission graph is shared across a code's scope-variants
    const permissions = findFeatureByCode(snapshot, featureCode)?.permissions;
    if (!permissions) continue;

    const deps = buildDependsMap(permissions);
    const labels = new Map(permissions.map((p) => [p.code, p.label]));

    for (const bucket of PLATFORMS) {
      const codes = platforms[bucket];
      if (!codes || codes.length === 0) continue;

      const granted = new Set(codes);
      const satisfied = filterGrantedByDeps(granted, deps);
      if (satisfied.size === granted.size) continue;

      // A dropped code is granted without a granted prerequisite — name the first offending pair
      for (const code of granted) {
        if (satisfied.has(code)) continue;
        const missing = (deps.get(code) ?? []).find((dep) => !satisfied.has(dep));
        const dependentName = labels.get(code) ?? code;
        const prereqName = missing ? (labels.get(missing) ?? missing) : 'its prerequisite';
        throw new BadRequestException({
          label: 'Invalid Permission Grant',
          detail: `"${dependentName}" requires "${prereqName}" to be granted first.`,
          errors: [{ field: featureCode, message: `${dependentName} requires ${prereqName}` }],
        });
      }
    }
  }
}

// Returns whether a role template is assignable at a site of the given type; custom/non-SITE templates always apply
export function templateAppliesAtSite(template: SnapshotRoleTemplate | undefined, siteType: SiteType): boolean {
  if (!template || template.scope !== 'SITE' || !template.siteType) return true;
  return template.siteType === siteType;
}

// Whether a role template may be OFFERED/ASSIGNED at a site — only SITE-scoped templates of the matching site type (custom roles always pass)
export function templateAssignableAtSite(template: SnapshotRoleTemplate | undefined, siteType: SiteType): boolean {
  if (!template) return true;
  if (template.scope !== 'SITE') return false;
  return !template.siteType || template.siteType === siteType;
}

// Expands a lock deny-list against the snapshot; passes null locks (inherit) or a missing snapshot through unchanged
export function normalizeLocks(
  featureLocks: SiteFeatureLocks | null,
  snapshot: VersionSnapshot | null,
): SiteFeatureLocks | null {
  if (!featureLocks || !snapshot) return featureLocks;
  return normalizeLockCascade(featureLocks, snapshot);
}

// Expands a site lock deny-list so locking a prerequisite also locks its dependents (per feature, per platform)
export function normalizeLockCascade(featureLocks: SiteFeatureLocks, snapshot: VersionSnapshot): SiteFeatureLocks {
  const result: SiteFeatureLocks = {};

  for (const [featureCode, platforms] of Object.entries(featureLocks)) {
    // Locks key features by bare code (scope-agnostic); the permission graph is shared across a code's scope-variants
    const permissions = findFeatureByCode(snapshot, featureCode)?.permissions;
    const normalized: PlatformDenyCodes = {};

    for (const bucket of PLATFORMS) {
      const codes = platforms[bucket];
      // undefined = untouched (skip); null = whole platform locked (pass through)
      if (codes === undefined) continue;
      if (codes === null) {
        normalized[bucket] = null;
        continue;
      }

      if (!permissions) {
        normalized[bucket] = codes;
        continue;
      }

      const deps = buildDependsMap(permissions);
      const universe = permissions.map((p) => p.code);
      const expanded = cascadeLocked(universe, new Set(codes), deps);
      normalized[bucket] = [...expanded];
    }

    result[featureCode] = normalized;
  }

  return result;
}
