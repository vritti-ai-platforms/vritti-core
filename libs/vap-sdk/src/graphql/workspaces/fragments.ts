import { graphql } from '../../gql';

/** One selectable scope. `parentId` is what lets a chooser render the hierarchy in one round trip. */
export const WorkspaceOptionFieldsFragment = graphql(`
  fragment WorkspaceOptionFields on WorkspaceOption {
    kind
    id
    name
    code
    parentId
  }
`);
