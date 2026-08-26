import { graphql } from '../../gql';

/**
 * Every scope the organization has, grouped by kind.
 *
 * Takes no arguments: the organization comes from the credential, so an app cannot ask what
 * another organization contains. Safe to response-cache — an org's structure changes rarely, and
 * nothing here is per-shopper.
 */
export const WORKSPACES_QUERY = graphql(`
  query Workspaces {
    workspaces {
      legalEntities {
        ...WorkspaceOptionFields
      }
      siteGroups {
        ...WorkspaceOptionFields
      }
      sites {
        ...WorkspaceOptionFields
      }
    }
  }
`);
