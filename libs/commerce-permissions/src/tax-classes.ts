// Tax classes permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_TAX_CLASSES = {
  featureCode: 'tax-classes',
  view: 'org.tax-classes.view',
  add: 'org.tax-classes.add',
  edit: 'org.tax-classes.edit',
  delete: 'org.tax-classes.delete',
  toggle: 'org.tax-classes.toggle',
  groups: {
    view: 'org.tax-classes.groups.view',
    add: 'org.tax-classes.groups.add',
    edit: 'org.tax-classes.groups.edit',
    delete: 'org.tax-classes.groups.delete',
  },
} as const;
