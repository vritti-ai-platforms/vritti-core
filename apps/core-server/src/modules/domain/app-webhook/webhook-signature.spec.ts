import { createPublicKey, verify } from 'node:crypto';
import { generateSigningKeyPair } from '@vritti/api-sdk/signing';
import { signWebhookPayload, verifyWebhookSignature, webhookSignatureBase } from './webhook-signature';

describe('webhook signature', () => {
  const { privateKey, publicKey } = generateSigningKeyPair();
  const body = '{"id":"evt-1","type":"payment_intent.succeeded","createdAt":"2026-10-09T11:50:00.000Z","data":{}}';
  const timestamp = '1791000000';

  it('signs the canonical timestamp-dot-body string', () => {
    const signature = signWebhookPayload(privateKey, timestamp, body);
    const key = createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });

    expect(webhookSignatureBase(timestamp, body)).toBe(`${timestamp}.${body}`);
    expect(verify(null, Buffer.from(`${timestamp}.${body}`, 'utf8'), key, Buffer.from(signature, 'base64'))).toBe(true);
  });

  it('verifies with the app public key', () => {
    const signature = signWebhookPayload(privateKey, timestamp, body);

    expect(verifyWebhookSignature(publicKey, timestamp, body, signature)).toBe(true);
  });

  it('fails for a changed body, a changed timestamp, or another key', () => {
    const signature = signWebhookPayload(privateKey, timestamp, body);
    const other = generateSigningKeyPair();

    expect(verifyWebhookSignature(publicKey, timestamp, `${body} `, signature)).toBe(false);
    expect(verifyWebhookSignature(publicKey, '1791000001', body, signature)).toBe(false);
    expect(verifyWebhookSignature(other.publicKey, timestamp, body, signature)).toBe(false);
  });

  it('treats a malformed key or signature as invalid rather than throwing', () => {
    expect(verifyWebhookSignature('not-a-key', timestamp, body, 'AAAA')).toBe(false);
  });
});
