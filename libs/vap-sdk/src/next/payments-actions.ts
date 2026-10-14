'use server';

import type { GatewayResponse, PaymentCheckout, PaymentIntent, PaymentIntentStatus } from '@vritti/vap-sdk';
import { getSdk } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { getCurrentParty, requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';

/**
 * Paying for a basket, as server actions.
 *
 * The flow is three steps, and only the middle one runs in the browser:
 *
 * 1. `startCheckoutAction` — a form post. Turns the basket into an order and opens its payment.
 * 2. `openCheckout(state.checkout)` from `@vritti/vap-sdk/checkout` — the gateway's modal.
 * 3. `confirmPaymentAction` — hands the gateway's response to core to verify.
 *
 * Core's webhook, not step 3, is what marks an order paid; a party who closes the tab after paying is
 * still paid. So there is one status read for a return page (`getPaymentIntentAction`) and,
 * deliberately, no polling helper.
 */

export type CheckoutActionState = PartyActionState & {
  paymentIntentId?: string;
  orderNumber?: string;
  /** What `openCheckout` needs. Null when the intent has nothing to launch — already settled. */
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

/** Long enough for any UUID or `booking-123:attempt-2`; core accepts at most 100 characters. */
const MAX_KEY_LENGTH = 100;

/**
 * Checks out the signed-in party's basket.
 *
 * Reads `addressId`, `notes`, `returnTo` and `idempotencyKey` from the form.
 *
 * **The idempotency key.** Preferred from a hidden `idempotencyKey` field the checkout page renders
 * — minted once per page render (`crypto.randomUUID()` in the server component). That identifies the
 * *attempt*: a double-clicked Pay, a retry after the modal was closed, or a resubmit after a network
 * blip all reuse it, and core answers the same order instead of creating a second. Without the
 * field, the key from the previous state is reused (same mounted form, same attempt), and only the
 * first submission mints one. A key derived from the basket's contents was rejected: an identical
 * basket bought again next week would collide with the first order.
 *
 * Does not revalidate: the basket is not paid yet, and a re-render would mint the page a new key
 * mid-attempt. `confirmPaymentAction` revalidates once the payment lands.
 */
export async function startCheckoutAction(
  previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);

  const idempotencyKey =
    formField(formData, 'idempotencyKey') || previous?.idempotencyKey || globalThis.crypto.randomUUID();
  if (idempotencyKey.length > MAX_KEY_LENGTH) return { error: 'This checkout could not be started.' };

  const addressId = formField(formData, 'addressId') || undefined;
  const notes = formField(formData, 'notes') || undefined;

  const payload = await resolvePayload();
  return withPartyErrors<CheckoutActionState>(payload, async () => {
    const session = await getSdk(payload)
      .forContext({ partyId: party.partyId })
      .checkout.startFromCart({ addressId, notes, idempotencyKey });
    return {
      ok: true,
      paymentIntentId: session.paymentIntent.id,
      orderNumber: session.order.orderNumber,
      checkout: session.paymentIntent.checkout,
      idempotencyKey,
    };
  }).then((state) => ({ idempotencyKey, ...state }));
}

/**
 * Hands the gateway's response to core and answers the intent's status.
 *
 * Called from client code with what `openCheckout` resolved — so every field is checked here, not
 * trusted. Acts for the signed-in party when there is one; a guest's intent is confirmed unbound.
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
    isNonEmpty(paymentIntentId) &&
    isNonEmpty(gatewayResponse?.orderId) &&
    isNonEmpty(gatewayResponse?.paymentId) &&
    isNonEmpty(gatewayResponse?.signature);
  if (!valid) return { error: 'That payment could not be confirmed.' };

  const party = await getCurrentParty();
  const payload = await resolvePayload();
  const result = await withPartyErrors<ConfirmPaymentActionState>(payload, async () => {
    const intent = await getSdk(payload)
      .forContext(party?.partyId ? { partyId: party.partyId } : {})
      .payments.confirmPayment({
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
 * so and lets the party refresh; the webhook settles it either way.
 */
export async function getPaymentIntentAction(paymentIntentId: string): Promise<PaymentIntentActionState> {
  if (!isNonEmpty(paymentIntentId)) return { error: 'No such payment.' };

  const party = await getCurrentParty();
  const payload = await resolvePayload();
  return withPartyErrors<PaymentIntentActionState>(payload, async () => ({
    paymentIntent: await getSdk(payload)
      .forContext(party?.partyId ? { partyId: party.partyId } : {})
      .payments.paymentIntent(paymentIntentId),
  }));
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_KEY_LENGTH;
}
