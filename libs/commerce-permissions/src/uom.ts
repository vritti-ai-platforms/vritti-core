// UOM permission codes — MUST match the cloud catalog's authored codes exactly.
export const UOM = {
  view: 'uom.view',
  create: 'uom.create',
  edit: 'uom.edit',
  delete: 'uom.delete',
  dim: {
    view: 'uom.dim.view',
    add: 'uom.dim.add',
    edit: 'uom.dim.edit',
    delete: 'uom.dim.delete',
  },
} as const;
