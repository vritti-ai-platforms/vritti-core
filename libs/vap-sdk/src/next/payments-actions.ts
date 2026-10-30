'use server';

import {
  type Checkout,
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

// Paying for a cart, as server actions a storefront imports directly.

export type CheckoutActionState = PartyActionState & {
  paymentIntentId?: string;
  // The checkout opened by `startCartCheckoutAction`; its orders are made once the payment lands
  checkoutId?: string;
  checkout?: PaymentCheckout | null;
  idempotencyKey?: string;
};

export type CheckoutStatusActionState = {
  error?: string;
  checkout?: Checkout;
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

// One checkout attempt as the form describes it: its key, the shopper's choices, and where core sends them back to
type CheckoutAttemptInput = {
  idempotencyKey: string;
  siteId?: string;
  gatewayCode?: string;
  addressId?: string;
  notes?: string;
  returnUrl?: string;
  checkoutUrl?: string;
};

// Reads the attempt both checkout actions take from the form. The key comes from the page's hidden field, else the
// previous answer, else is minted here — so pressing Pay again stays on this attempt
async function readAttempt(
  previous: CheckoutActionState,
  formData: FormData,
  returnTo: string,
): Promise<CheckoutAttemptInput> {
  const idempotencyKey =
    formField(formData, 'idempotencyKey') || previous?.idempotencyKey || globalThis.crypto.randomUUID();

  const origin = await requestOrigin();
  const returnPath = localPath(formField(formData, 'returnPath')) ?? '/checkout/return';
  const checkoutPath = localPath(formField(formData, 'checkoutPath')) ?? localPath(returnTo) ?? '/checkout';

  return {
    idempotencyKey,
    // The store being checked out, when the page names one
    siteId: formField(formData, 'siteId') || undefined,
    // The gateway the shopper picked on the payment page; left out, the only one on offer is used
    gatewayCode: formField(formData, 'gatewayCode') || undefined,
    addressId: formField(formData, 'addressId') || undefined,
    notes: formField(formData, 'notes') || undefined,
    returnUrl: origin ? `${origin}${returnPath}` : undefined,
    checkoutUrl: origin ? checkoutRetryUrl(`${origin}${checkoutPath}`, { idempotencyKey }) : undefined,
  };
}

const KEY_TOO_LONG: CheckoutActionState = {
  error: 'This checkout could not be started. Reload the page and try again.',
};

// Pays for the signed-in party's cart as one payment — every store it holds lines at, or the one the form's `siteId`
// names. The cart is frozen into a checkout and one order per store is made once the payment lands; the return page
// reads the checkout, by `checkoutId`, for the orders.
export async function startCartCheckoutAction(
  previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);

  const attempt = await readAttempt(previous, formData, returnTo);
  if (attempt.idempotencyKey.length > MAX_KEY_LENGTH) return KEY_TOO_LONG;

  const payload = await resolvePayload();
  const state = await withPartyErrors<CheckoutActionState>(payload, async () => {
    const checkout = await (await vapSdk(payload, { partyId: party.partyId })).checkout.start(attempt);
    // Core opens the payment as it answers; a checkout without one is a checkout that cannot be paid
    if (!checkout.paymentIntent) {
      return { error: 'The payment could not be opened. Try again in a moment.' };
    }
    return {
      ok: true,
      checkoutId: checkout.id,
      paymentIntentId: checkout.paymentIntent.id,
      checkout: checkout.paymentIntent.checkout,
    };
  });
  return { ...state, idempotencyKey: attempt.idempotencyKey };
}

// One read of a checkout — its payment and the orders it became — for a return page.
export async function getCheckoutAction(checkoutId: string): Promise<CheckoutStatusActionState> {
  if (!isId(checkoutId)) return { error: 'No such checkout.' };

  const party = await getCurrentParty();
  const payload = await resolvePayload();
  return withPartyErrors<CheckoutStatusActionState>(payload, async () => ({
    checkout: await (await vapSdk(payload, party?.partyId ? { partyId: party.partyId } : {})).checkout.find(checkoutId),
  }));
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

  // The cart was emptied into the order, and the header's count renders on every page.
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
