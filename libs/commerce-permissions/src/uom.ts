// UOM permission codes — MUST match the cloud catalog's authored codes exactly.
export const UOM = {
  featureCode: 'uom',
  view: 'uom.view',
  add: 'uom.add',
  edit: 'uom.edit',
  delete: 'uom.delete',
  dim: {
    view: 'uom.dim.view',
    add: 'uom.dim.add',
    edit: 'uom.dim.edit',
    delete: 'uom.dim.delete',
  },
} as const;
