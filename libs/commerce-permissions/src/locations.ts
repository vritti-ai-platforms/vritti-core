// Location permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const SITE_LOCATIONS = {
  featureCode: 'locations',
  view: 'site.locations.view',
  add: 'site.locations.add',
  edit: 'site.locations.edit',
  delete: 'site.locations.delete',
  quants: {
    view: 'site.locations.quants.view',
  },
} as const;
