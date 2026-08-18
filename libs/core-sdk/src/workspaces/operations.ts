import type { Transport } from '../transport';
import type { Workspaces } from './types';

const WORKSPACE_FIELDS = 'kind id name code parentId';

const LIST = `query Workspaces {
  workspaces {
    legalEntities { ${WORKSPACE_FIELDS} }
    siteGroups { ${WORKSPACE_FIELDS} }
    sites { ${WORKSPACE_FIELDS} }
  }
}`;

/**
 * The scopes this app's organization has.
 *
 * Needed because core accepts a scope header but never tells a caller what the valid
 * values are — without this an app has to hardcode a site or legal-entity id. Pick one
 * from here, pass it to `forContext`, and the SDK turns the `kind` into the right header.
 *
 * The organization is never listed: it comes from the app credential, and organization
 * scope is expressed by sending no workspace header at all.
 */
export function createWorkspacesOperations(request: Transport) {
  return {
    list: () => request<Workspaces>(LIST),
  };
}

export type WorkspacesOperations = ReturnType<typeof createWorkspacesOperations>;
