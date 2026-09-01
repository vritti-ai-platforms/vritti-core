import type { SmsOtp } from '@/db/schema';
import { DELIVERED } from '../request/sms-otp-status.dto';

export const SmsOtpStatusValues = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

export type SmsOtpStatus = (typeof SmsOtpStatusValues)[keyof typeof SmsOtpStatusValues];

export class SmsOtpDto {
  id: string;
  appId: string;
  providerId: string;
  provider: string;
  recipient: string;
  status: SmsOtpStatus;
  attempts: number;
  isVerified: boolean;
  messageId: string | null;
  error: string | null;
  deliveryStatus: string | null;
  deliveredAt: string | null;
  expiresAt: string;
  createdAt: string;
  verifiedAt: string | null;

  // Maps the entity, dropping codeHash so a code never leaves this service
  static from(entity: SmsOtp): SmsOtpDto {
    const dto = new SmsOtpDto();
    dto.id = entity.id;
    dto.appId = entity.appId;
    dto.providerId = entity.providerId;
    dto.provider = entity.provider;
    dto.recipient = entity.recipient;
    dto.status = resolveStatus(entity);
    dto.attempts = entity.attempts;
    dto.isVerified = entity.isVerified;
    dto.messageId = entity.messageId;
    dto.error = entity.error;
    dto.deliveryStatus = entity.deliveryStatus;
    dto.deliveredAt = entity.deliveredAt?.toISOString() ?? null;
    dto.expiresAt = entity.expiresAt.toISOString();
    dto.createdAt = entity.createdAt.toISOString();
    dto.verifiedAt = entity.verifiedAt?.toISOString() ?? null;
    return dto;
  }
}

// Derived from the row rather than stored, so it cannot drift from delivery callbacks.
// Verified outranks everything: a code someone typed back clearly reached them.
export function resolveStatus(entity: SmsOtp): SmsOtpStatus {
  if (entity.isVerified) return SmsOtpStatusValues.VERIFIED;
  if (entity.error) return SmsOtpStatusValues.FAILED;
  if (entity.deliveryStatus === DELIVERED) return SmsOtpStatusValues.DELIVERED;
  return SmsOtpStatusValues.SENT;
}
