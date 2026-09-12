// Offerings permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
// Every scope owns the offerings it creates, so all three carry the full surface — reach is bounded by
// row ownership (RLS), not by the permission set.
// Dimensions and variants are tabs on the offering, so each carries its own view alongside the parent's.
// Seeding a dimension from a template is its own permission: it copies a shared, wider-scoped template
// onto the offering, which is a different act from defining one inline.
// A variant's bill of materials is edited under variants — it records which stock a variant draws on,
// which is ordinary variant maintenance. Manufacturing BOMs belong to inventory items, not here.
export const ORG_OFFERINGS = {
  featureCode: 'offerings',
  view: 'org.offerings.view',
  add: 'org.offerings.add',
  edit: 'org.offerings.edit',
  delete: 'org.offerings.delete',
  setTaxClass: 'org.offerings.set-tax-class',
  toggle: 'org.offerings.toggle',
  dimensions: {
    view: 'org.offerings.dimensions.view',
    add: 'org.offerings.dimensions.add',
    addFromTemplate: 'org.offerings.dimensions.add-from-template',
    edit: 'org.offerings.dimensions.edit',
    delete: 'org.offerings.dimensions.delete',
  },
  variants: {
    view: 'org.offerings.variants.view',
    add: 'org.offerings.variants.add',
    edit: 'org.offerings.variants.edit',
    delete: 'org.offerings.variants.delete',
    setTaxClass: 'org.offerings.variants.set-tax-class',
    // Every bill-of-materials action, nested to mirror the dotted code. It still groups under
    // `variants` in the catalog — the authoring script takes only the first segment.
    bom: {
      view: 'org.offerings.variants.bom.view',
      add: 'org.offerings.variants.bom.add',
      edit: 'org.offerings.variants.bom.edit',
      delete: 'org.offerings.variants.bom.delete',
      // Linking the item that already carries the variant's SKU, without naming it
      addFromSuggestion: 'org.offerings.variants.bom.add-from-suggestion',
      // Reaches into inventory items, so it is its own grant. Org only — a site enables
      // org-owned items rather than creating them, and a company has no such feature.
      createInventoryItem: 'org.offerings.variants.bom.create-inventory-item',
    },
  },
} as const;

export const LE_OFFERINGS = {
  featureCode: 'offerings',
  view: 'le.offerings.view',
  add: 'le.offerings.add',
  edit: 'le.offerings.edit',
  delete: 'le.offerings.delete',
  setTaxClass: 'le.offerings.set-tax-class',
  toggle: 'le.offerings.toggle',
  dimensions: {
    view: 'le.offerings.dimensions.view',
    add: 'le.offerings.dimensions.add',
    addFromTemplate: 'le.offerings.dimensions.add-from-template',
    edit: 'le.offerings.dimensions.edit',
    delete: 'le.offerings.dimensions.delete',
  },
  variants: {
    view: 'le.offerings.variants.view',
    add: 'le.offerings.variants.add',
    edit: 'le.offerings.variants.edit',
    delete: 'le.offerings.variants.delete',
    setTaxClass: 'le.offerings.variants.set-tax-class',
    // Every bill-of-materials action, nested to mirror the dotted code. It still groups under
    // `variants` in the catalog — the authoring script takes only the first segment.
    bom: {
      view: 'le.offerings.variants.bom.view',
      add: 'le.offerings.variants.bom.add',
      edit: 'le.offerings.variants.bom.edit',
      delete: 'le.offerings.variants.bom.delete',
      // Linking the item that already carries the variant's SKU, without naming it
      addFromSuggestion: 'le.offerings.variants.bom.add-from-suggestion',
    },
  },
} as const;

export const SITE_OFFERINGS = {
  featureCode: 'offerings',
  view: 'site.offerings.view',
  add: 'site.offerings.add',
  edit: 'site.offerings.edit',
  delete: 'site.offerings.delete',
  setTaxClass: 'site.offerings.set-tax-class',
  toggle: 'site.offerings.toggle',
  dimensions: {
    view: 'site.offerings.dimensions.view',
    add: 'site.offerings.dimensions.add',
    addFromTemplate: 'site.offerings.dimensions.add-from-template',
    edit: 'site.offerings.dimensions.edit',
    delete: 'site.offerings.dimensions.delete',
  },
  variants: {
    view: 'site.offerings.variants.view',
    add: 'site.offerings.variants.add',
    edit: 'site.offerings.variants.edit',
    delete: 'site.offerings.variants.delete',
    setTaxClass: 'site.offerings.variants.set-tax-class',
    // Every bill-of-materials action, nested to mirror the dotted code. It still groups under
    // `variants` in the catalog — the authoring script takes only the first segment.
    bom: {
      view: 'site.offerings.variants.bom.view',
      add: 'site.offerings.variants.bom.add',
      edit: 'site.offerings.variants.bom.edit',
      delete: 'site.offerings.variants.bom.delete',
      // Linking the item that already carries the variant's SKU, without naming it
      addFromSuggestion: 'site.offerings.variants.bom.add-from-suggestion',
    },
  },
} as const;
