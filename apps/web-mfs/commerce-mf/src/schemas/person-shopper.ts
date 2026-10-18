import type { CurrencyAmount } from '@vritti/quantum-ui/format';

export interface PersonWishlistRow {
  id: string;
  appId: string;
  catalogListingId: string;
  offeringVariantId: string;
  name: string;
  code: string | null;
  price: CurrencyAmount | null;
  isAvailable: boolean;
  createdAt: string;
}
