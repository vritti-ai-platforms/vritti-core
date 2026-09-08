/**
 * Paths of the two-step Embedded Signup flow, served from one fixed origin.
 *
 * Unprefixed, like the webhook paths: these are browser-facing, not part of the `communications-api`
 * surface. The callback's absolute URL — this path on `api.<BASE_DOMAIN>` — is what goes in the Meta
 * app's "Valid OAuth Redirect URIs" list, so it is referenced from one constant rather than spelled
 * out twice.
 *
 * Nothing needs to go in "Allowed Domains for the JavaScript SDK" any more: the flow is a top-level
 * OAuth redirect and loads no Facebook SDK, so that list no longer applies.
 */
export const EMBEDDED_SIGNUP_BROKER_PATH = '/communications/whatsapp/connect';

/**
 * Where Meta returns the operator once the flow finishes.
 *
 * Must stay free of query parameters: Strict Mode matches `redirect_uri` exactly and permits only
 * `state` as an addition, which is precisely what carries our nonce back.
 */
export const EMBEDDED_SIGNUP_CALLBACK_PATH = `${EMBEDDED_SIGNUP_BROKER_PATH}/callback`;
