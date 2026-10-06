/**
 * The sign-in actions, re-exported.
 *
 * Deliberately carries no `'use server'` of its own: a barrel without the directive passes through
 * the transform untouched, and the bundler resolves the chain to `auth-actions.ts` where the
 * references were registered. Shaped after `@payloadcms/next`'s `dist/exports/auth.js`, which is
 * the arrangement Next demonstrably handles.
 */
export {
  completeOtpAction,
  requestOtpAction,
  restartOtpAction,
  verifyOtpAction,
} from './auth-actions.js';
export {
  currentOtpCode,
  currentOtpFlow,
  currentOtpStep,
  type OtpCodeState,
  type OtpStep,
  type SealedOtpFlow,
  stepFromFlow,
} from './otp-flow.js';
export { nextOtpPorts } from './ports.js';
export { type VapNextConfig, VAP_NEXT_KEY } from './payload-adapter.js';
export { getCurrentParty, type PartySession, requireParty } from './party.js';
