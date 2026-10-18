import { generateKeyPairSync, type KeyObject, sign } from 'node:crypto';
import { describe, expect, it } from '@jest/globals';
import { VapWebhookError, type VapWebhookErrorReason, verifyVapWebhook } from './webhooks.js';

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKey,
    clientSecret: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    publicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
  };
}

const event = {
  id: 'evt_1',
  type: 'payment_intent.succeeded',
  createdAt: '2026-10-09T10:00:00.000Z',
  data: {
    paymentIntentId: 'pi_1',
    appId: 'app_1',
    partyId: 'party_1',
    legalEntityId: null,
    siteId: 'site_1',
    configId: 'cfg_1',
    reference: { type: 'booking', id: 'b_1' },
    amount: { currency: 'INR', value: '499.00' },
    method: 'upi',
    providerPaymentId: 'pay_1',
    paidAt: '2026-10-09T10:00:00.000Z',
    failure: null,
    metadata: [{ key: 'slot', value: 'morning' }],
  },
};

// What core sends: the headers, and a signature over `${timestamp}.${rawBody}`.
function deliver(privateKey: KeyObject, rawBody: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = sign(null, Buffer.from(`${timestamp}.${rawBody}`, 'utf8'), privateKey).toString('base64');
  return {
    'x-vap-event-id': 'evt_1',
    'x-vap-timestamp': String(timestamp),
    'x-vap-signature': signature,
  };
}

function reasonOf(fn: () => unknown): VapWebhookErrorReason | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof VapWebhookError) return error.reason;
    throw error;
  }
  return undefined;
}

describe('verifyVapWebhook', () => {
  const app = keyPair();
  const rawBody = JSON.stringify(event);

  it('accepts a genuine delivery, verified with the clientSecret', () => {
    const verified = verifyVapWebhook({
      rawBody,
      headers: deliver(app.privateKey, rawBody),
      clientSecret: app.clientSecret,
    });
    expect(verified.type).toBe('payment_intent.succeeded');
    expect(verified.id).toBe('evt_1');
    if (verified.type === 'webhook.test') throw new Error('narrowing');
    expect(verified.data.reference).toEqual({ type: 'booking', id: 'b_1' });
    expect(verified.data.amount).toEqual({ currency: 'INR', value: '499.00' });
    // A key/value list on the wire is flattened to a map.
    expect(verified.data.metadata).toEqual({ slot: 'morning' });
  });

  it('accepts an explicit spki public key and fetch Headers', () => {
    const headers = new Headers(deliver(app.privateKey, rawBody));
    const verified = verifyVapWebhook({ rawBody: Buffer.from(rawBody), headers, publicKey: app.publicKey });
    expect(verified.id).toBe('evt_1');
  });

  it('refuses a tampered body', () => {
    const headers = deliver(app.privateKey, rawBody);
    const tampered = rawBody.replace('499.00', '1.00');
    expect(reasonOf(() => verifyVapWebhook({ rawBody: tampered, headers, clientSecret: app.clientSecret }))).toBe(
      'bad_signature',
    );
  });

  it('refuses a stale timestamp even when the signature is genuine', () => {
    const old = Math.floor(Date.now() / 1000) - 301;
    const headers = deliver(app.privateKey, rawBody, old);
    expect(reasonOf(() => verifyVapWebhook({ rawBody, headers, clientSecret: app.clientSecret }))).toBe(
      'stale_timestamp',
    );
    // …and accepts it inside a wider window.
    expect(verifyVapWebhook({ rawBody, headers, clientSecret: app.clientSecret, toleranceSeconds: 600 }).id).toBe(
      'evt_1',
    );
  });

  it('refuses a delivery signed by another key', () => {
    const other = keyPair();
    const headers = deliver(other.privateKey, rawBody);
    expect(reasonOf(() => verifyVapWebhook({ rawBody, headers, clientSecret: app.clientSecret }))).toBe(
      'bad_signature',
    );
  });

  it('refuses missing headers', () => {
    const { 'x-vap-signature': _omitted, ...headers } = deliver(app.privateKey, rawBody);
    expect(reasonOf(() => verifyVapWebhook({ rawBody, headers, clientSecret: app.clientSecret }))).toBe(
      'missing_headers',
    );
  });

  it('refuses a signed body that is not JSON', () => {
    const notJson = 'not json';
    expect(
      reasonOf(() =>
        verifyVapWebhook({
          rawBody: notJson,
          headers: deliver(app.privateKey, notJson),
          clientSecret: app.clientSecret,
        }),
      ),
    ).toBe('bad_json');
  });

  it('refuses an event id header that does not match the signed body', () => {
    const headers = { ...deliver(app.privateKey, rawBody), 'x-vap-event-id': 'evt_other' };
    expect(reasonOf(() => verifyVapWebhook({ rawBody, headers, clientSecret: app.clientSecret }))).toBe(
      'bad_signature',
    );
  });

  it('marks an authentic but unknown event type as unsupported, not forged', () => {
    const body = JSON.stringify({ ...event, type: 'refund.created' });
    expect(
      reasonOf(() =>
        verifyVapWebhook({ rawBody: body, headers: deliver(app.privateKey, body), clientSecret: app.clientSecret }),
      ),
    ).toBe('unsupported_event');
  });

  it('needs a key', () => {
    expect(reasonOf(() => verifyVapWebhook({ rawBody, headers: deliver(app.privateKey, rawBody) }))).toBe('no_key');
  });
});
