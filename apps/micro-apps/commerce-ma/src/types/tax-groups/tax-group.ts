// A tax group (mirrors the TaxGroup GraphQL type): a named, active/inactive group of tax rates. `canDelete`
// is false when referenced by an inventory item (purchase) or offering (sale). No server `total` — the card
// sums `rate` across `taxRates`.
export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  sortOrder: number;
}

export interface TaxGroup {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
  taxRates: TaxRate[];
}
