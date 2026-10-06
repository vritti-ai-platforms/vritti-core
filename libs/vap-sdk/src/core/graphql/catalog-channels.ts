import { graphql } from '../gql';

/**
 * One listing row, shared by every read below.
 *
 * `id` is the **catalogue listing** — the id a site stores against its own product page, and the
 * one a basket line and a wishlist row both point at.
 */
export const LISTING_FIELDS_FRAGMENT = graphql(`
  fragment ListingFields on CatalogListing {
    id
    offeringVariantId
    sku
    name
    price {
      ...MoneyFields
    }
  }
`);

/**
 * One page of what this storefront sells, with the filter rail beside it.
 *
 * The range is resolved from the calling credential's own APP channel and the workspace from the
 * headers the request carries, so one query serves org, company and outlet.
 *
 * `filters` is resolved server-side only when selected, so a caller that wants prices alone does not
 * pay for the facet aggregates. Every value's `count` is computed per the catalog's own filter mode.
 */
export const CATALOG_LISTINGS_QUERY = graphql(`
  query CatalogListings($filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    catalogListings(filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
      items {
        ...ListingFields
      }
      total
      page
      perPage
      filters {
        kind
        code
        name
        sortOrder
        values {
          code
          name
          count
        }
      }
    }
  }
`);

/** One listing, by the variant a storefront stores against its own product row. Null when not sold here. */
export const CATALOG_LISTING_QUERY = graphql(`
  query CatalogListing($variantId: ID!) {
    catalogListing(variantId: $variantId) {
      ...ListingFields
    }
  }
`);

/** The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket. */
export const CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query CatalogListingsFromVariants($variantIds: [ID!]!) {
    catalogListingsFromVariants(variantIds: $variantIds) {
      ...ListingFields
    }
  }
`);

/** The same reads for a legal entity's B2B website — checked in LE scope, sent with `x-le-id`. */
export const LE_CATALOG_LISTINGS_QUERY = graphql(`
  query LeCatalogListings($filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    leCatalogListings(filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
      items {
        ...ListingFields
      }
      total
      page
      perPage
      filters {
        kind
        code
        name
        sortOrder
        values {
          code
          name
          count
        }
      }
    }
  }
`);

export const LE_CATALOG_LISTING_QUERY = graphql(`
  query LeCatalogListing($variantId: ID!) {
    leCatalogListing(variantId: $variantId) {
      ...ListingFields
    }
  }
`);

export const LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {
    leCatalogListingsFromVariants(variantIds: $variantIds) {
      ...ListingFields
    }
  }
`);

/** The same reads for an outlet's customer website — checked in SITE scope, sent with `x-site-id`. */
export const SITE_CATALOG_LISTINGS_QUERY = graphql(`
  query SiteCatalogListings($filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    siteCatalogListings(filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
      items {
        ...ListingFields
      }
      total
      page
      perPage
      filters {
        kind
        code
        name
        sortOrder
        values {
          code
          name
          count
        }
      }
    }
  }
`);

export const SITE_CATALOG_LISTING_QUERY = graphql(`
  query SiteCatalogListing($variantId: ID!) {
    siteCatalogListing(variantId: $variantId) {
      ...ListingFields
    }
  }
`);

export const SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY = graphql(`
  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {
    siteCatalogListingsFromVariants(variantIds: $variantIds) {
      ...ListingFields
    }
  }
`);
