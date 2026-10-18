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

// Paying for a basket, as server actions a storefront imports directly.

export type CheckoutActionState = PartyActionState & {
  paymentIntentId?: string;
  orderNumber?: string;
  checkout?: PaymentCheckout | null;
  idempotencyKey?: string;
};

export type ConfirmPaymentActionState = {
  error?: string;
  status?: PaymentIntentStatus;
  orderNumber?: string;
};

export type PaymentIntentActionState = {
  error?: string;
  paymentIntent?: PaymentIntent;
};

export type CancelPaymentActionState = PartyActionState & {
  status?: PaymentIntentStatus;
};

const MAX_KEY_LENGTH = 100;

// Checks out the signed-in party's basket.
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

// Hands what the gateway's modal resolved to core and answers the intent's status.
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

// One read of an intent — what a return page shows.
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

// Abandons a payment the party has not made — "cancel this order" on an unpaid one.
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

// The origin the party is on — where core should send them back to.
async function requestOrigin(): Promise<string | undefined> {
  const list = await headers();
  const origin = list.get('origin');
  if (origin && origin !== 'null') return origin;
  const host = list.get('x-forwarded-host') ?? list.get('host');
  if (!host) return undefined;
  const proto = list.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  return `${proto}://${host}`;
}

// A path on this storefront, or undefined — never `//other.site` or a full URL, which would leave it.
function localPath(value: string): string | undefined {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : undefined;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_KEY_LENGTH;
}
