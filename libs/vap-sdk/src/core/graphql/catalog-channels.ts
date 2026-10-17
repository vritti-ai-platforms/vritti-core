import { graphql } from '../gql/index.js';

/**
 * One listing row, shared by every read below.
 *
 * `id` is the **catalogue listing** — the id a site stores against its own product page, and the
 * one a basket line and a wishlist row both point at.
 */
export const LISTING_FIELDS_FRAGMENT = graphql(`
  fragment ListingFields on CatalogListing {
    id
    code
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
/** What this storefront may price in — the switcher's options, before a currency is chosen. */
export const CATALOG_CURRENCIES_QUERY = graphql(`
  query CatalogCurrencies {
    catalogCurrencies
  }
`);

export const LE_CATALOG_CURRENCIES_QUERY = graphql(`
  query LeCatalogCurrencies {
    leCatalogCurrencies
  }
`);

export const SITE_CATALOG_CURRENCIES_QUERY = graphql(`
  query SiteCatalogCurrencies {
    siteCatalogCurrencies
  }
`);

export const CATALOG_LISTINGS_QUERY = graphql(`
  query CatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    catalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
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

/**
 * One listing by code, with the axes a product page switches flavour and size on.
 *
 * `axes` carries only values a sellable sibling holds, and each option's `code` is resolved by
 * holding every other axis where it is — so from 250g · Dark Chocolate the 750g option leads to
 * 750g · Dark Chocolate, and is null when that combination is not sold here.
 */
export const CATALOG_LISTING_QUERY_BY_CODE = graphql(`
  query CatalogListingByCode($code: String!, $currencyCode: String!) {
    catalogListingByCode(code: $code, currencyCode: $currencyCode) {
      listing {
        ...ListingFields
      }
      axes {
        code
        name
        sortOrder
        options {
          code
          name
          selected
          variantCode
        }
      }
    }
  }
`);

/** The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket. */
export const CATALOG_LISTINGS_BY_CODES_QUERY = graphql(`
  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {
    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {
      ...ListingFields
    }
  }
`);

/** The same reads for a legal entity's B2B website — checked in LE scope, sent with `x-le-id`. */
export const LE_CATALOG_LISTINGS_QUERY = graphql(`
  query LeCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    leCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
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

export const LE_CATALOG_LISTING_QUERY_BY_CODE = graphql(`
  query LeCatalogListingByCode($code: String!, $currencyCode: String!) {
    leCatalogListingByCode(code: $code, currencyCode: $currencyCode) {
      listing {
        ...ListingFields
      }
      axes {
        code
        name
        sortOrder
        options {
          code
          name
          selected
          variantCode
        }
      }
    }
  }
`);

export const LE_CATALOG_LISTINGS_BY_CODES_QUERY = graphql(`
  query LeCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {
    leCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {
      ...ListingFields
    }
  }
`);

/** The same reads for an outlet's customer website — checked in SITE scope, sent with `x-site-id`. */
export const SITE_CATALOG_LISTINGS_QUERY = graphql(`
  query SiteCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {
    siteCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {
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

export const SITE_CATALOG_LISTING_QUERY_BY_CODE = graphql(`
  query SiteCatalogListingByCode($code: String!, $currencyCode: String!) {
    siteCatalogListingByCode(code: $code, currencyCode: $currencyCode) {
      listing {
        ...ListingFields
      }
      axes {
        code
        name
        sortOrder
        options {
          code
          name
          selected
          variantCode
        }
      }
    }
  }
`);

export const SITE_CATALOG_LISTINGS_BY_CODES_QUERY = graphql(`
  query SiteCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {
    siteCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {
      ...ListingFields
    }
  }
`);
