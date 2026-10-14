import { graphql } from '../gql';

/**
 * The stores this storefront may sell from — the options behind a store switcher.
 *
 * Org-scoped, so it carries no workspace header: a caller asking which stores exist has not chosen
 * one yet, and a site header would narrow the very question being asked.
 *
 * `legalEntityId` and `currencyCode` ride on every store, which is what lets one click set a whole
 * selling context without a second read.
 *
 * `types` narrows in the database, so a shopper-facing switcher asks for `[OUTLET]` rather than being
 * handed warehouses to discard — which would put rows in the payload, and in the response cache, that
 * the question never wanted.
 */
export const APP_SITES_QUERY = graphql(`
  query AppSites($types: [AppSiteType!]) {
    appSites(types: $types) {
      id
      code
      name
      type
      timezone
      legalEntityId
      currencyCode
      sortOrder
    }
  }
`);

/**
 * The legal entities this storefront may sell as.
 *
 * Its own query because it is its own permission on core, and because the two are wanted separately:
 * a shop with a store switcher never asks this, and a shop selling at entity level never asks the
 * other. `currencyCode` is the reason it exists — the only place a currency is stated.
 */
export const APP_LEGAL_ENTITIES_QUERY = graphql(`
  query AppLegalEntities {
    appLegalEntities {
      id
      code
      name
      currencyCode
      country
      sortOrder
    }
  }
`);
