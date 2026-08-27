import type { WhatsappOtp } from '@/db/schema';
import { DELIVERED, READ } from '../request/whatsapp-otp-status.dto';

export const WhatsappOtpStatusValues = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

export type WhatsappOtpStatus = (typeof WhatsappOtpStatusValues)[keyof typeof WhatsappOtpStatusValues];

export class WhatsappOtpDto {
  id: string;
  appId: string;
  accountId: string;
  recipient: string;
  status: WhatsappOtpStatus;
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
  static from(entity: WhatsappOtp): WhatsappOtpDto {
    const dto = new WhatsappOtpDto();
    dto.id = entity.id;
    dto.appId = entity.appId;
    dto.accountId = entity.accountId;
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

// Derives status from the row rather than storing it, so it cannot drift from the delivery callbacks.
// Verified outranks everything: a code someone typed back clearly reached them.
export function resolveStatus(entity: WhatsappOtp): WhatsappOtpStatus {
  if (entity.isVerified) return WhatsappOtpStatusValues.VERIFIED;
  if (entity.error) return WhatsappOtpStatusValues.FAILED;
  if (entity.deliveryStatus === READ) return WhatsappOtpStatusValues.READ;
  if (entity.deliveryStatus === DELIVERED) return WhatsappOtpStatusValues.DELIVERED;
  return WhatsappOtpStatusValues.SENT;
}
