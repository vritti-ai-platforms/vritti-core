// Where a visitor is shopping: the reader, the switch actions, and the cookie's name.

export type { PartyActionState } from './state.js';
export { VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';
export {
  defaultCurrency,
  linkVisitorSession,
  resolveWorkspace,
  scopeOf,
  seededWorkspace,
  unlinkVisitorSession,
  type VisitorSessionRow,
  vapSdk,
  type Workspace,
  workspaceCurrencies,
} from './visitor-session.js';
export {
  setCurrencyAction,
  setLegalEntityWorkspaceAction,
  setWorkspaceAction,
  switchCurrencyAction,
  switchLegalEntityAction,
  switchStoreAction,
} from './workspace-actions.js';
