import { BadRequestException } from '@vritti/api-sdk';
import {
  type BuFeatureLocks,
  buildDependsMap,
  cascadeLocked,
  type FeatureUnlocks,
  filterGrantedByDeps,
  PLATFORMS,
  type PlatformDenyCodes,
  type VersionSnapshot,
} from '@vritti/api-sdk/catalog-resolver';

// Rejects role grants that enable a dependent permission without its prerequisite (per feature, per platform)
export function validateGrantDependencies(features: FeatureUnlocks, snapshot: VersionSnapshot): void {
  for (const [featureCode, platforms] of Object.entries(features)) {
    const permissions = snapshot.features[featureCode]?.permissions;
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

// Expands a BU lock deny-list so locking a prerequisite also locks its dependents (per feature, per platform)
export function normalizeLockCascade(featureLocks: BuFeatureLocks, snapshot: VersionSnapshot): BuFeatureLocks {
  const result: BuFeatureLocks = {};

  for (const [featureCode, platforms] of Object.entries(featureLocks)) {
    const permissions = snapshot.features[featureCode]?.permissions;
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
