import { graphql } from '../gql/index.js';

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
