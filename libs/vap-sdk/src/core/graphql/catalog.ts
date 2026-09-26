import { graphql } from '../gql';

/**
 * Everything this storefront sells.
 *
 * No arguments: the range is resolved from the calling credential's own APP channel, so a site can
 * read what it was given and nothing else.
 *
 * `id` is the **catalogue listing** — the id a site stores against its own product page, and the
 * one a basket line and a wishlist row both point at.
 */
export const CATALOG_LISTINGS_QUERY = graphql(`
  query CatalogListings {
    catalogListings {
      id
      offeringVariantId
      sku
      name
      price {
        ...MoneyFields
      }
    }
  }
`);
