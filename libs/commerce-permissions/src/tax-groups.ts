// Tax-group permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const LE_TAX_GROUPS = {
  featureCode: 'tax-groups',
  view: 'le.tax-groups.view',
  add: 'le.tax-groups.add',
  edit: 'le.tax-groups.edit',
  delete: 'le.tax-groups.delete',
} as const;
