import type { ConfigService } from '@nestjs/config';
import { PaymentCredentialsCryptoService } from './payment-credentials-crypto.service';

const makeService = (key = 'test-payment-credentials-key-with-enough-length') =>
  new PaymentCredentialsCryptoService({ getOrThrow: () => key } as unknown as ConfigService);

describe('PaymentCredentialsCryptoService', () => {
  it('round-trips a value through encrypt and decrypt', () => {
    const service = makeService();
    const plaintext = JSON.stringify({ key_id: 'rzp_test_123', key_secret: 's3cr3t' });

    const ciphertext = service.encrypt(plaintext);

    expect(ciphertext).not.toContain('rzp_test_123');
    expect(service.decrypt(ciphertext)).toBe(plaintext);
  });

  it('uses a fresh IV on every call so equal inputs never share a ciphertext', () => {
    const service = makeService();

    expect(service.encrypt('same')).not.toBe(service.encrypt('same'));
  });

  it('rejects a tampered ciphertext', () => {
    const service = makeService();
    const raw = Buffer.from(service.encrypt('payload'), 'base64');
    raw[raw.length - 1] ^= 0xff;

    expect(() => service.decrypt(raw.toString('base64'))).toThrow();
  });

  it('rejects a ciphertext produced under a different key', () => {
    const ciphertext = makeService('key-one-000000000000000000000000').encrypt('payload');

    expect(() => makeService('key-two-000000000000000000000000').decrypt(ciphertext)).toThrow();
  });
});
