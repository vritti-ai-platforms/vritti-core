// Gitea organization permission codes — MUST match the cloud catalog's authored codes exactly.
// `setup` declares a dependency on `view` in the catalog, so a role granted `setup` alone has it
// filtered out.
export const ORG_ORGANIZATION = {
  featureCode: 'organization',
  view: 'org.organization.view',
  setup: 'org.organization.setup',
} as const;
