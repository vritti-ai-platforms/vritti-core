'use server';

import {
  checkoutRetryUrl,
  type GatewayResponse,
  type PaymentCheckout,
  type PaymentIntent,
  type PaymentIntentStatus,
} from '@vritti/vap-sdk';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getCurrentParty, requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { vapSdk } from './visitor-session.js';

/**
 * Paying for a basket, as server actions a storefront imports directly.
 *
 * The flow is three steps, and only the middle one runs in the browser:
 *
 * 1. `startCheckoutAction` — a form post. Turns the basket into an order and opens its payment.
 * 2. The gateway — either `embeddedCheckout` + `submitEmbeddedCheckout` from `@vritti/vap-sdk/next/checkout`,
 *    which leaves for the gateway's page, or `openCheckout`, the gateway's modal over the page.
 * 3. Confirming — for the embedded page Razorpay posts to **core**, which confirms and redirects the party
 *    to the return or checkout URL this action handed over; for the modal, `confirmPaymentAction`.
 *
 * **Every call goes through `vapSdk`**, like the basket's: the order is placed at the store the visitor
 * is shopping in, and priced in that store's currency — the same ones the basket they just saw was read
 * in. `getSdk(payload).forContext({ partyId })` by hand would quietly check out at the deployment's
 * default store instead.
 *
 * Core's webhook is what settles a payment a party walked away from, so there is one status read for a
 * return page (`getPaymentIntentAction`) and, deliberately, no polling helper.
 */

export type CheckoutActionState = PartyActionState & {
  paymentIntentId?: string;
  orderNumber?: string;
  /** What the gateway step is built from. Null when the intent has nothing to launch — already settled. */
  checkout?: PaymentCheckout | null;
  /**
   * The key this attempt used. Carried in the state so a resubmit of the same mounted form — after a
   * dismissed modal or a transient error — reuses it and lands on the same order.
   */
  idempotencyKey?: string;
};

export type ConfirmPaymentActionState = {
  error?: string;
  status?: PaymentIntentStatus;
  /** Echoed from the input, so the client can route to a confirmation page from one value. */
  orderNumber?: string;
};

export type PaymentIntentActionState = {
  error?: string;
  paymentIntent?: PaymentIntent;
};

export type CancelPaymentActionState = PartyActionState & {
  status?: PaymentIntentStatus;
};

/** Long enough for any UUID or `booking-123:attempt-2`; core accepts at most 100 characters. */
const MAX_KEY_LENGTH = 100;

/**
 * Checks out the signed-in party's basket.
 *
 * Reads `addressId`, `notes`, `returnTo` and `idempotencyKey` from the form, and the two pages core
 * sends the party back to after the gateway's page:
 *
 * - `returnPath` — default `/checkout/return`. Core adds `intent` and `order`; read them with
 *   `readCheckoutAttempt`.
 * - `checkoutPath` — default `returnTo`. Core adds `payment=failed|cancelled`; the attempt's key rides
 *   along as `retry`, so `readCheckoutRetry` hands the page the key to render again.
 *
 * Both are paths on this storefront, made absolute on the origin the form was posted from. Core only
 * redirects to an origin listed on the app's allowed origins in Vritti Cloud.
 *
 * **The idempotency key.** Preferred from a hidden `idempotencyKey` field the checkout page renders
 * — minted once per page render (`crypto.randomUUID()` in the server component). That identifies the
 * *attempt*: a double-clicked Pay, a retry after the gateway was closed, or a resubmit after a network
 * blip all reuse it, and core answers the same order instead of creating a second. Without the
 * field, the key from the previous state is reused (same mounted form, same attempt), and only the
 * first submission mints one. A key derived from the basket's contents was rejected: an identical
 * basket bought again next week would collide with the first order.
 *
 * Does not revalidate: the basket is not paid yet, and a re-render would mint the page a new key
 * mid-attempt. Confirming revalidates once the payment lands.
 */
export async function startCheckoutAction(
  previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);

  const idempotencyKey =
    formField(formData, 'idempotencyKey') || previous?.idempotencyKey || globalThis.crypto.randomUUID();
  if (idempotencyKey.length > MAX_KEY_LENGTH) {
    return { error: 'This checkout could not be started. Reload the page and try again.' };
  }

  const addressId = formField(formData, 'addressId') || undefined;
  const notes = formField(formData, 'notes') || undefined;

  const origin = await requestOrigin();
  const returnPath = localPath(formField(formData, 'returnPath')) ?? '/checkout/return';
  const checkoutPath = localPath(formField(formData, 'checkoutPath')) ?? localPath(returnTo) ?? '/checkout';
  const returnUrl = origin ? `${origin}${returnPath}` : undefined;
  const checkoutUrl = origin ? checkoutRetryUrl(`${origin}${checkoutPath}`, { idempotencyKey }) : undefined;

  const payload = await resolvePayload();
  const state = await withPartyErrors<CheckoutActionState>(payload, async () => {
    const session = await (await vapSdk(payload, { partyId: party.partyId })).checkout.startFromCart({
      addressId,
      notes,
      idempotencyKey,
      returnUrl,
      checkoutUrl,
    });
    return {
      ok: true,
      paymentIntentId: session.paymentIntent.id,
      orderNumber: session.order.orderNumber,
      checkout: session.paymentIntent.checkout,
    };
  });
  // The key travels with every answer, failures included, so pressing Pay again stays on this attempt
  return { ...state, idempotencyKey };
}

/**
 * Hands what the gateway's modal resolved to core and answers the intent's status.
 *
 * For `openCheckout`. The embedded page posts to core instead, which confirms there and redirects. Called from client code, so every field is checked here rather than
 * trusted — and nothing is taken on the browser's word anyway: core checks the signature with the
 * merchant's secret and reads the payment back from the gateway.
 *
 * `SUCCEEDED` means paid. `PROCESSING` means the gateway has not settled yet — show "we'll confirm
 * shortly"; the webhook will finish it. Anything else did not go through.
 */
export async function confirmPaymentAction(input: {
  paymentIntentId: string;
  gatewayResponse: GatewayResponse;
  orderNumber?: string;
}): Promise<ConfirmPaymentActionState> {
  const { paymentIntentId, gatewayResponse, orderNumber } = input ?? {};
  const valid =
    isId(paymentIntentId) &&
    isId(gatewayResponse?.orderId) &&
    isId(gatewayResponse?.paymentId) &&
    isId(gatewayResponse?.signature);
  if (!valid) return { error: 'That payment could not be confirmed.' };

  const party = await getCurrentParty();
  const payload = await resolvePayload();
  const result = await withPartyErrors<ConfirmPaymentActionState>(payload, async () => {
    const sdk = await vapSdk(payload, party?.partyId ? { partyId: party.partyId } : {});
    const intent = await sdk.payments.confirmPayment({
      paymentIntentId,
      gatewayResponse: {
        orderId: gatewayResponse.orderId,
        paymentId: gatewayResponse.paymentId,
        signature: gatewayResponse.signature,
      },
    });
    return {
      status: intent.status,
      ...(typeof orderNumber === 'string' && orderNumber ? { orderNumber } : {}),
    };
  });

  // The basket was emptied into the order, and the header's count renders on every page.
  if (result.status === 'SUCCEEDED' || result.status === 'PROCESSING') revalidatePath('/', 'layout');
  return result;
}

/**
 * One read of an intent — what a return page shows.
 *
 * Once, not on a timer: the product decision is no polling. A page that finds it `PROCESSING` says
 * so and lets the party refresh; the webhook settles it either way. Read as the signed-in party, so
 * an intent id copied from somebody else's URL reads as not found.
 */
export async function getPaymentIntentAction(paymentIntentId: string): Promise<PaymentIntentActionState> {
  if (!isId(paymentIntentId)) return { error: 'No such payment.' };

  const party = await getCurrentParty();
  const payload = await resolvePayload();
  return withPartyErrors<PaymentIntentActionState>(payload, async () => ({
    paymentIntent: await (
      await vapSdk(payload, party?.partyId ? { partyId: party.partyId } : {})
    ).payments.paymentIntent(paymentIntentId),
  }));
}

/**
 * Abandons a payment the party has not made — "cancel this order" on an unpaid one.
 *
 * Reads `paymentIntentId` and `returnTo` from the form. Core cancels the intent and the order it was
 * paying for, and refuses one that is already paid or still being settled — that refusal is shown as
 * it comes. Needs the party the intent belongs to: somebody else's intent reads as not found.
 */
export async function cancelPaymentAction(
  _previous: CancelPaymentActionState,
  formData: FormData,
): Promise<CancelPaymentActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const paymentIntentId = formField(formData, 'paymentIntentId');
  if (!isId(paymentIntentId)) return { error: 'No such payment.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors<CancelPaymentActionState>(payload, async () => {
    const intent = await (await vapSdk(payload, { partyId: party.partyId })).payments.cancelPaymentIntent(
      paymentIntentId,
    );
    return { ok: true, status: intent.status };
  });
  revalidatePath(returnTo);
  return result;
}

/**
 * The origin the party is on — where core should send them back to.
 *
 * `Origin` first: a browser sends it on every server-action POST, and it is the address the party
 * actually typed. The forwarded host is the fallback behind a proxy that strips it. Undefined when
 * neither is present, and then no return URL is sent — the embedded page refuses to open without one,
 * which names the problem, rather than sending the party somewhere guessed.
 */
async function requestOrigin(): Promise<string | undefined> {
  const list = await headers();
  const origin = list.get('origin');
  if (origin && origin !== 'null') return origin;
  const host = list.get('x-forwarded-host') ?? list.get('host');
  if (!host) return undefined;
  const proto = list.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  return `${proto}://${host}`;
}

/** A path on this storefront, or undefined — never `//other.site` or a full URL, which would leave it. */
function localPath(value: string): string | undefined {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : undefined;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_KEY_LENGTH;
}
