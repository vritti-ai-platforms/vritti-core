// Gitea organisation permission codes — MUST match the cloud catalog's authored codes exactly.
// Note the British singular spelling: the catalog feature code is `organisation`.
// `setup` declares a dependency on `view` in the catalog, so a role granted `setup` alone has it
// filtered out.
export const ORG_ORGANISATION = {
  featureCode: 'organisation',
  view: 'org.organisation.view',
  setup: 'org.organisation.setup',
} as const;
