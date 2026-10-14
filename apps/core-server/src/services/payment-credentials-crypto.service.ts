import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

@Injectable()
export class PaymentCredentialsCryptoService {
  constructor(private readonly configService: ConfigService) {}

  // Encrypts a value at rest with AES-256-GCM; returns base64(iv || authTag || ciphertext)
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.deriveKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  }

  // Decrypts a value produced by encrypt(); a tampered payload fails the GCM auth tag check
  decrypt(ciphertext: string): string {
    const raw = Buffer.from(ciphertext, 'base64');
    const iv = raw.subarray(0, IV_BYTES);
    const authTag = raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const encrypted = raw.subarray(IV_BYTES + AUTH_TAG_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', this.deriveKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  // Derives the 32-byte AES key from PAYMENT_CREDENTIALS_KEY
  private deriveKey(): Buffer {
    const secret = this.configService.getOrThrow<string>('PAYMENT_CREDENTIALS_KEY');
    return createHash('sha256').update(secret, 'utf8').digest();
  }
}
