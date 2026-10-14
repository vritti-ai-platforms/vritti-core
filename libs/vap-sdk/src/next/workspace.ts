/**
 * Where a visitor is shopping: the reader, the switch actions, and the cookie's name.
 *
 * Deliberately carries no `'use server'` of its own — a barrel without the directive passes through
 * the transform untouched and the bundler resolves the chain to `workspace-actions.ts`, where the
 * references were registered. Same arrangement as `auth.ts`.
 *
 * `resolveWorkspace` is in here too, and is *not* an action: it is read by server components, which
 * need an ordinary function. That is why it lives in `visitor-session.ts` rather than beside the actions —
 * every export of a `'use server'` module becomes a callable endpoint.
 */

export type { PartyActionState } from './state.js';
export { VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';
export {
  linkVisitorSession,
  resolveWorkspace,
  seededWorkspace,
  unlinkVisitorSession,
  type VisitorSessionRow,
  type Workspace,
} from './visitor-session.js';
export {
  setLegalEntityWorkspaceAction,
  setWorkspaceAction,
  switchLegalEntityAction,
  switchStoreAction,
} from './workspace-actions.js';
