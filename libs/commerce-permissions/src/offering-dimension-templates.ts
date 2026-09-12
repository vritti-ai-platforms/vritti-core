// Offering dimension templates permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
// Every scope owns its own template library, so all three carry the full surface — reach is bounded by
// row ownership (RLS), not by the permission set.
// A template's values are replaced as a set through one endpoint, so they need one code, not three.
export const ORG_OFFERING_DIMENSION_TEMPLATES = {
  featureCode: 'offering-dimension-templates',
  view: 'org.offering-dimension-templates.view',
  add: 'org.offering-dimension-templates.add',
  edit: 'org.offering-dimension-templates.edit',
  delete: 'org.offering-dimension-templates.delete',
  toggle: 'org.offering-dimension-templates.toggle',
  values: {
    upsert: 'org.offering-dimension-templates.values.upsert',
  },
} as const;

export const LE_OFFERING_DIMENSION_TEMPLATES = {
  featureCode: 'offering-dimension-templates',
  view: 'le.offering-dimension-templates.view',
  add: 'le.offering-dimension-templates.add',
  edit: 'le.offering-dimension-templates.edit',
  delete: 'le.offering-dimension-templates.delete',
  toggle: 'le.offering-dimension-templates.toggle',
  values: {
    upsert: 'le.offering-dimension-templates.values.upsert',
  },
} as const;

export const SITE_OFFERING_DIMENSION_TEMPLATES = {
  featureCode: 'offering-dimension-templates',
  view: 'site.offering-dimension-templates.view',
  add: 'site.offering-dimension-templates.add',
  edit: 'site.offering-dimension-templates.edit',
  delete: 'site.offering-dimension-templates.delete',
  toggle: 'site.offering-dimension-templates.toggle',
  values: {
    upsert: 'site.offering-dimension-templates.values.upsert',
  },
} as const;
