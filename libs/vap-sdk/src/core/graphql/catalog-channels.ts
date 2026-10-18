import { graphql } from '../gql/index.js';

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

export const CATALOG_LISTINGS_BY_CODES_QUERY = graphql(`
  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {
    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {
      ...ListingFields
    }
  }
`);

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
