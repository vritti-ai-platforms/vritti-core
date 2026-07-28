// Gitea repositories permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_REPOSITORIES = {
  featureCode: 'repositories',
  view: 'org.repositories.view',
  add: 'org.repositories.add',
  edit: 'org.repositories.edit',
  delete: 'org.repositories.delete',
} as const;
