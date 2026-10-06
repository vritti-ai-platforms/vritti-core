// Attribute templates permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
// Every scope owns its own template library, so all three carry the full surface — reach is bounded by
// row ownership (RLS), not by the permission set.
// A template's values are replaced as a set through one endpoint, so they need one code, not three.
export const ORG_ATTRIBUTE_TEMPLATES = {
  featureCode: 'attribute-templates',
  view: 'org.attribute-templates.view',
  add: 'org.attribute-templates.add',
  edit: 'org.attribute-templates.edit',
  delete: 'org.attribute-templates.delete',
  toggle: 'org.attribute-templates.toggle',
  values: {
    upsert: 'org.attribute-templates.values.upsert',
  },
} as const;

export const LE_ATTRIBUTE_TEMPLATES = {
  featureCode: 'attribute-templates',
  view: 'le.attribute-templates.view',
  add: 'le.attribute-templates.add',
  edit: 'le.attribute-templates.edit',
  delete: 'le.attribute-templates.delete',
  toggle: 'le.attribute-templates.toggle',
  values: {
    upsert: 'le.attribute-templates.values.upsert',
  },
} as const;

export const SITE_ATTRIBUTE_TEMPLATES = {
  featureCode: 'attribute-templates',
  view: 'site.attribute-templates.view',
  add: 'site.attribute-templates.add',
  edit: 'site.attribute-templates.edit',
  delete: 'site.attribute-templates.delete',
  toggle: 'site.attribute-templates.toggle',
  values: {
    upsert: 'site.attribute-templates.values.upsert',
  },
} as const;
