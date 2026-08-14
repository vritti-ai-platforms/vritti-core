// Barrel — prefer the per-feature subpaths (@vritti/gitea-permissions/repository) in app code.
// Each feature file hosts one object per workspace scope it's exposed in (ORG_*).

export { ORG_ORGANIZATION } from './organization';
export { ORG_REPOSITORIES } from './repository';
