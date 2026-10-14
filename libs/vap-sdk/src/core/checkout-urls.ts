/**
 * The storefront URLs one checkout attempt comes back to — environment-free, so the server action that
 * writes them and the pages that read them share one spelling.
 *
 * The embedded checkout leaves the storefront for the gateway's page. Razorpay posts the result to
 * core, which confirms it and redirects the party to one of two storefront URLs handed over when the
 * checkout started:
 *
 * - the **return URL**, with `intent` and `order` added — read with `readCheckoutAttempt`;
 * - the **checkout URL**, with `payment=failed|cancelled` (and the gateway's `message`) added. The
 *   storefront puts the attempt's `retry` key in it up front with `checkoutRetryUrl`, so Pay again lands
 *   on the same order — read with `readCheckoutRetry`.
 */

/** One checkout attempt: the intent to confirm, the order number to show, the key a retry reuses. */
export type CheckoutAttempt = {
  paymentIntentId: string;
  orderNumber?: string;
  idempotencyKey?: string;
};

/** What `readCheckoutRetry` found on a checkout page the gateway sent the party back to. */
export type CheckoutRetry = {
  /** The key the failed attempt ran under. Reuse it so Pay again reaches the same order. */
  idempotencyKey?: string;
  /** `failed` after a decline, `cancelled` after the party left the gateway's page. */
  outcome?: 'failed' | 'cancelled';
  /** The gateway's sentence for a decline, written for the payer. Plain text — render it as such. */
  message?: string;
};

type SearchParamsLike = URLSearchParams | Record<string, string | string[] | undefined>;

const ATTEMPT_PARAMS = { intent: 'intent', order: 'order', key: 'key' } as const;
const RETRY_PARAMS = { key: 'retry', outcome: 'payment', message: 'message' } as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Order numbers are echoed onto a page under "your order is placed", so only something shaped like one passes
const ORDER_NUMBER = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
// Core accepts idempotency keys of at most 100 characters
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,100}$/;
const MAX_GATEWAY_MESSAGE = 200;

function param(params: SearchParamsLike, name: string): string {
  if (params instanceof URLSearchParams) return params.get(name)?.trim() ?? '';
  const value = params[name];
  return ((Array.isArray(value) ? value[0] : value) ?? '').trim();
}

function withQuery(base: string, query: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) if (value) search.set(name, value);
  const text = search.toString();
  if (!text) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${text}`;
}

/** `base` with the attempt in its query — the `callback_url`, and the return page the callback sends on to. */
export function checkoutAttemptUrl(base: string, attempt: CheckoutAttempt): string {
  return withQuery(base, {
    [ATTEMPT_PARAMS.intent]: attempt.paymentIntentId,
    [ATTEMPT_PARAMS.order]: attempt.orderNumber,
    [ATTEMPT_PARAMS.key]: attempt.idempotencyKey,
  });
}

/**
 * The attempt `checkoutAttemptUrl` wrote, or null without a valid intent id.
 *
 * Everything here arrived in a URL, so it is the visitor's to rewrite: values that are not the shape
 * they should be are dropped rather than passed on.
 */
export function readCheckoutAttempt(params: SearchParamsLike): CheckoutAttempt | null {
  const paymentIntentId = param(params, ATTEMPT_PARAMS.intent);
  if (!UUID.test(paymentIntentId)) return null;
  const orderNumber = param(params, ATTEMPT_PARAMS.order);
  const idempotencyKey = param(params, ATTEMPT_PARAMS.key);
  return {
    paymentIntentId,
    ...(ORDER_NUMBER.test(orderNumber) ? { orderNumber } : {}),
    ...(IDEMPOTENCY_KEY.test(idempotencyKey) ? { idempotencyKey } : {}),
  };
}

/** The checkout page to come back to after a decline or a cancel, carrying the key for a retry. */
export function checkoutRetryUrl(base: string, retry: CheckoutRetry): string {
  return withQuery(base, {
    [RETRY_PARAMS.key]: retry.idempotencyKey,
    [RETRY_PARAMS.outcome]: retry.outcome,
    [RETRY_PARAMS.message]: retry.message?.slice(0, MAX_GATEWAY_MESSAGE),
  });
}

/** What `checkoutRetryUrl` wrote, each value dropped unless it is the shape it should be. */
export function readCheckoutRetry(params: SearchParamsLike): CheckoutRetry {
  const idempotencyKey = param(params, RETRY_PARAMS.key);
  const outcome = param(params, RETRY_PARAMS.outcome);
  const message = param(params, RETRY_PARAMS.message).slice(0, MAX_GATEWAY_MESSAGE);
  return {
    ...(IDEMPOTENCY_KEY.test(idempotencyKey) ? { idempotencyKey } : {}),
    ...(outcome === 'failed' || outcome === 'cancelled' ? { outcome } : {}),
    ...(message ? { message } : {}),
  };
}
