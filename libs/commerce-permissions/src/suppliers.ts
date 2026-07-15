// Suppliers permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const LE_SUPPLIERS = {
  featureCode: 'suppliers',
  view: 'le.suppliers.view',
} as const;
