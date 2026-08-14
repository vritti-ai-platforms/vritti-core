// Gitea organization permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const ORG_ORGANIZATION = {
  featureCode: 'organization',
  view: 'org.organization.view',
  setup: 'org.organization.setup',
} as const;
