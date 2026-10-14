import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

// The exact bytes a receiver re-builds and verifies: the unix-seconds timestamp, a dot, then the raw body
export function webhookSignatureBase(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

// Signs a delivery with the app's Ed25519 private key (base64 pkcs8 DER); returns the base64 signature
export function signWebhookPayload(privateKeyBase64: string, timestamp: string, rawBody: string): string {
  const key = createPrivateKey({ key: Buffer.from(privateKeyBase64, 'base64'), format: 'der', type: 'pkcs8' });
  return sign(null, Buffer.from(webhookSignatureBase(timestamp, rawBody), 'utf8'), key).toString('base64');
}

// Verifies a delivery signature against the app's public key (base64 spki DER); malformed input is false
export function verifyWebhookSignature(
  publicKeyBase64: string,
  timestamp: string,
  rawBody: string,
  signatureBase64: string,
): boolean {
  try {
    const key = createPublicKey({ key: Buffer.from(publicKeyBase64, 'base64'), format: 'der', type: 'spki' });
    return verify(
      null,
      Buffer.from(webhookSignatureBase(timestamp, rawBody), 'utf8'),
      key,
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch {
    return false;
  }
}
