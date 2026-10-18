import { createPrivateKey, createPublicKey, type KeyObject, verify } from 'node:crypto';
import type { PaymentReference } from '../core/domains/payments.js';
import type { Money } from '../core/types.js';

// Verifying the webhooks core sends a website — payment outcomes, delivered server to server.

export const VAP_EVENT_ID_HEADER = 'x-vap-event-id';
export const VAP_TIMESTAMP_HEADER = 'x-vap-timestamp';
export const VAP_SIGNATURE_HEADER = 'x-vap-signature';

export type VapPaymentEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.expired';

export type VapWebhookEventType = VapPaymentEventType | 'webhook.test';

export type VapPaymentEventData = {
  paymentIntentId: string;
  appId: string;
  partyId: string | null;
  legalEntityId: string | null;
  siteId: string | null;
  configId: string | null;
  reference: PaymentReference;
  amount: Money;
  method: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  failure: { code: string | null; message: string | null } | null;
  metadata: Record<string, string>;
  late?: boolean;
};

export type VapPaymentEvent = {
  id: string;
  type: VapPaymentEventType;
  createdAt: string;
  data: VapPaymentEventData;
};

export type VapTestEvent = {
  id: string;
  type: 'webhook.test';
  createdAt: string;
  data: Record<string, unknown>;
};

export type VapWebhookEvent = VapPaymentEvent | VapTestEvent;

export type VapWebhookErrorReason =
  // No key to verify with — neither `clientSecret` nor `publicKey`, or one that is not a valid key.
  | 'no_key'
  | 'missing_headers'
  | 'stale_timestamp'
  | 'bad_signature'
  | 'bad_json'
  // Authentic, but a type this SDK version does not know.
  | 'unsupported_event';

export class VapWebhookError extends Error {
  constructor(
    readonly reason: VapWebhookErrorReason,
    message: string,
  ) {
    super(message);
    this.name = 'VapWebhookError';
  }
}

export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

export type VerifyVapWebhookInput = {
  rawBody: string | Uint8Array;
  headers: WebhookHeaders;
  clientSecret?: string;
  publicKey?: string;
  toleranceSeconds?: number;
};

const PAYMENT_EVENT_TYPES: readonly string[] = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.expired',
];

function header(headers: WebhookHeaders, name: string): string | undefined {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) return headers.get(name) ?? undefined;
  const record = headers as Record<string, string | string[] | undefined>;
  const value = record[name] ?? Object.entries(record).find(([key]) => key.toLowerCase() === name)?.[1];
  return Array.isArray(value) ? value[0] : value;
}

function verificationKey(input: VerifyVapWebhookInput): KeyObject {
  try {
    if (input.publicKey) {
      return createPublicKey({ key: Buffer.from(input.publicKey, 'base64'), format: 'der', type: 'spki' });
    }
    if (input.clientSecret) {
      const privateKey = createPrivateKey({
        key: Buffer.from(input.clientSecret, 'base64'),
        format: 'der',
        type: 'pkcs8',
      });
      return createPublicKey(privateKey);
    }
  } catch {
    throw new VapWebhookError('no_key', 'The webhook key is not a valid Ed25519 key.');
  }
  throw new VapWebhookError('no_key', 'Pass clientSecret or publicKey to verify a VAP webhook.');
}

function toMetadata(value: unknown): Record<string, string> {
  if (Array.isArray(value)) {
    const out: Record<string, string> = {};
    for (const entry of value) {
      if (entry && typeof entry === 'object' && 'key' in entry && 'value' in entry) {
        out[String(entry.key)] = String(entry.value);
      }
    }
    return out;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, v]) => [key, String(v)]));
  }
  return {};
}

// Proves a webhook came from core and returns it typed — or throws `VapWebhookError`.
export function verifyVapWebhook(input: VerifyVapWebhookInput): VapWebhookEvent {
  const key = verificationKey(input);
  const tolerance = input.toleranceSeconds ?? 300;

  const eventId = header(input.headers, VAP_EVENT_ID_HEADER);
  const timestamp = header(input.headers, VAP_TIMESTAMP_HEADER);
  const signature = header(input.headers, VAP_SIGNATURE_HEADER);
  if (!eventId || !timestamp || !signature) {
    throw new VapWebhookError(
      'missing_headers',
      `A VAP webhook needs ${VAP_EVENT_ID_HEADER}, ${VAP_TIMESTAMP_HEADER} and ${VAP_SIGNATURE_HEADER}.`,
    );
  }
  if (!/^\d+$/.test(timestamp)) {
    throw new VapWebhookError('missing_headers', `${VAP_TIMESTAMP_HEADER} is not a unix timestamp.`);
  }

  const body = typeof input.rawBody === 'string' ? Buffer.from(input.rawBody, 'utf8') : Buffer.from(input.rawBody);
  // Bytes, not a decoded-then-re-encoded string, so what is verified is exactly what arrived.
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), body]);

  let valid = false;
  try {
    valid = verify(null, signed, key, Buffer.from(signature, 'base64'));
  } catch {
    valid = false;
  }
  if (!valid) throw new VapWebhookError('bad_signature', 'The webhook signature does not match.');

  // After the signature, so a stale-but-authentic delivery is told apart from a forged one.
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (Math.abs(age) > tolerance) {
    throw new VapWebhookError('stale_timestamp', `The webhook is ${age}s old — outside the ${tolerance}s window.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    throw new VapWebhookError('bad_json', 'The webhook body is not JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new VapWebhookError('bad_json', 'The webhook body is not an event object.');
  }

  const event = parsed as { id?: unknown; type?: unknown; createdAt?: unknown; data?: unknown };
  if (typeof event.id !== 'string' || typeof event.type !== 'string' || !event.data || typeof event.data !== 'object') {
    throw new VapWebhookError('bad_json', 'The webhook body is not an event object.');
  }
  // The body is signed and the header is not; a mismatch means the header was rewritten in transit.
  if (event.id !== eventId) {
    throw new VapWebhookError('bad_signature', `${VAP_EVENT_ID_HEADER} does not match the signed event.`);
  }

  const createdAt = typeof event.createdAt === 'string' ? event.createdAt : '';
  const data = event.data as Record<string, unknown>;

  if (event.type === 'webhook.test') {
    return { id: event.id, type: 'webhook.test', createdAt, data };
  }
  if (!PAYMENT_EVENT_TYPES.includes(event.type)) {
    throw new VapWebhookError('unsupported_event', `Unhandled VAP event type "${event.type}".`);
  }

  return {
    id: event.id,
    type: event.type as VapPaymentEventType,
    createdAt,
    data: { ...(data as VapPaymentEventData), metadata: toMetadata(data.metadata) },
  };
}
