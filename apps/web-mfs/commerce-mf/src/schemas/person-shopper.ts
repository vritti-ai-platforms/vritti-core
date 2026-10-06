import type { CurrencyAmount } from '@vritti/quantum-ui/format';

export interface PersonWishlistRow {
  id: string;
  appId: string;
  catalogListingId: string;
  // What the storefront's own product record is keyed on — stable across sites, unlike the listing
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: CurrencyAmount | null;
  isAvailable: boolean;
  createdAt: string;
}
