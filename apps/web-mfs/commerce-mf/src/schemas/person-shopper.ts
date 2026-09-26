import type { CurrencyAmount } from '@vritti/quantum-ui/format';

/**
 * A person's saved list, as staff see it.
 *
 * Not a data table: it is a handful of rows the shopper chose, so there is no server state to save
 * and nothing to sort by that would mean anything. It comes back as a plain array.
 *
 * Every row carries `appId` because a person may shop in more than one of the organization's
 * storefronts. Their **basket** is not here — a basket belongs to the outlet it was opened at, so it
 * lives under Site → Carts.
 */

export interface PersonWishlistRow {
  id: string;
  appId: string;
  catalogListingId: string;
  /** What the storefront's own product record is keyed on — stable across sites, unlike the listing. */
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: CurrencyAmount | null;
  isAvailable: boolean;
  createdAt: string;
}
