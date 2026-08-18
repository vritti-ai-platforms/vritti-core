export {
  CHANNELS,
  type Channel,
  type CreatePersonInput,
  createPeopleOperations,
  type LocalRecord,
  type PeopleOperations,
  type Person,
  type PersonCommunication,
  type RegisterPersonHooks,
  type RegisterPersonInput,
  type RegisterPersonResult,
} from './people';
export { type CoreSdk, createCoreSdk } from './sdk';
export { signRequest } from './signing';
export { CLIENT_ID_HEADER, createTransport, PARTY_ID_HEADER, type Transport } from './transport';
export { CoreError, type CoreSdkConfig, PartyRollbackError } from './types';
export {
  createWorkspacesOperations,
  type RequestContext,
  type Workspace,
  type WorkspaceKind,
  type WorkspaceOption,
  type Workspaces,
  type WorkspacesOperations,
  workspaceHeaders,
} from './workspaces';
