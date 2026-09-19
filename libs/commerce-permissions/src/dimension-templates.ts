// Dimension templates permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
// Every scope owns its own template library, so all three carry the full surface — reach is bounded by
// row ownership (RLS), not by the permission set.
// A template's values are replaced as a set through one endpoint, so they need one code, not three.
export const ORG_DIMENSION_TEMPLATES = {
  featureCode: 'dimension-templates',
  view: 'org.dimension-templates.view',
  add: 'org.dimension-templates.add',
  edit: 'org.dimension-templates.edit',
  delete: 'org.dimension-templates.delete',
  toggle: 'org.dimension-templates.toggle',
  values: {
    upsert: 'org.dimension-templates.values.upsert',
  },
} as const;

export const LE_DIMENSION_TEMPLATES = {
  featureCode: 'dimension-templates',
  view: 'le.dimension-templates.view',
  add: 'le.dimension-templates.add',
  edit: 'le.dimension-templates.edit',
  delete: 'le.dimension-templates.delete',
  toggle: 'le.dimension-templates.toggle',
  values: {
    upsert: 'le.dimension-templates.values.upsert',
  },
} as const;

export const SITE_DIMENSION_TEMPLATES = {
  featureCode: 'dimension-templates',
  view: 'site.dimension-templates.view',
  add: 'site.dimension-templates.add',
  edit: 'site.dimension-templates.edit',
  delete: 'site.dimension-templates.delete',
  toggle: 'site.dimension-templates.toggle',
  values: {
    upsert: 'site.dimension-templates.values.upsert',
  },
} as const;
