import { graphql } from '../gql';

/**
 * Everything this storefront sells.
 *
 * No arguments: the range is resolved from the calling credential's own APP channel, and the
 * workspace from the headers the request carries — so one query serves org, company and outlet, and
 * a site reads what it was given and nothing else.
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

/** The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket. */
export const CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query CatalogListingsFromVariants($variantIds: [ID!]!) {
    catalogListingsFromVariants(variantIds: $variantIds) {
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

/** The same range for a legal entity's B2B website — checked in LE scope, sent with `x-le-id`. */
export const LE_CATALOG_LISTINGS_QUERY = graphql(`
  query LeCatalogListings {
    leCatalogListings {
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

export const LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {
    leCatalogListingsFromVariants(variantIds: $variantIds) {
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

/** The same range for an outlet's customer website — checked in SITE scope, sent with `x-site-id`. */
export const SITE_CATALOG_LISTINGS_QUERY = graphql(`
  query SiteCatalogListings {
    siteCatalogListings {
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

export const SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {
    siteCatalogListingsFromVariants(variantIds: $variantIds) {
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
