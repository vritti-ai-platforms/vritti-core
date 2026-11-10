export const ORG_TAX_GROUPS = {
  featureCode: 'tax-groups',
  view: 'org.tax-groups.view',
  add: 'org.tax-groups.add',
  edit: 'org.tax-groups.edit',
  delete: 'org.tax-groups.delete',
  toggle: 'org.tax-groups.toggle',
  rates: {
    view: 'org.tax-groups.rates.view',
    add: 'org.tax-groups.rates.add',
    edit: 'org.tax-groups.rates.edit',
    delete: 'org.tax-groups.rates.delete',
  },
  classes: {
    view: 'org.tax-groups.classes.view',
    add: 'org.tax-groups.classes.add',
    edit: 'org.tax-groups.classes.edit',
    delete: 'org.tax-groups.classes.delete',
  },
} as const;
