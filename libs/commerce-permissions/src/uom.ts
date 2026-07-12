// UOM permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const ORG_UOM = {
  featureCode: 'uom',
  view: 'org.uom.view',
  add: 'org.uom.add',
  edit: 'org.uom.edit',
  delete: 'org.uom.delete',
  dim: {
    view: 'org.uom.dim.view',
    add: 'org.uom.dim.add',
    edit: 'org.uom.dim.edit',
    delete: 'org.uom.dim.delete',
  },
} as const;
