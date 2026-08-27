import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WhatsappOtpStatusValues = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

export type WhatsappOtpStatus = (typeof WhatsappOtpStatusValues)[keyof typeof WhatsappOtpStatusValues];

export class ConfiguredOtpAppResponseDto {
  @ApiProperty({ description: 'App credential ID' })
  id: string;

  @ApiProperty({ description: 'App name as cloud shows it' })
  name: string;

  @ApiProperty({ description: 'App credential type' })
  type: string;

  @ApiProperty({ description: 'Whether the credential is usable' })
  isActive: boolean;

  @ApiProperty({ description: 'WhatsApp account the codes are sent from' })
  accountId: string;

  @ApiProperty({ description: 'Approved AUTHENTICATION template used' })
  templateName: string;

  @ApiProperty({ description: 'Seconds a code stays valid' })
  expirySeconds: number;
}

export class WhatsappOtpResponseDto {
  @ApiProperty({ description: 'OTP record ID' })
  id: string;

  @ApiProperty({ description: 'App credential the code was issued for' })
  appId: string;

  @ApiProperty({ description: 'WhatsApp account the code was sent from' })
  accountId: string;

  @ApiProperty({ description: 'Recipient phone number in E.164' })
  recipient: string;

  @ApiProperty({ enum: WhatsappOtpStatusValues, description: 'Derived from delivery, verification, and expiry' })
  status: WhatsappOtpStatus;

  @ApiProperty({ description: 'Verification attempts made against this code' })
  attempts: number;

  @ApiProperty({ description: 'Whether the code was successfully verified' })
  isVerified: boolean;

  @ApiPropertyOptional({ description: "Meta's message ID; null when the send failed" })
  messageId: string | null;

  @ApiPropertyOptional({ description: 'Delivery failure reason; null on success' })
  error: string | null;

  @ApiPropertyOptional({ description: "Meta's raw delivery status: sent | delivered | read | failed" })
  deliveryStatus: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp Meta confirmed delivery' })
  deliveredAt: string | null;

  @ApiProperty({ description: 'ISO timestamp the code stops being valid' })
  expiresAt: string;

  @ApiProperty({ description: 'ISO timestamp the code was issued' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'ISO timestamp the code was verified' })
  verifiedAt: string | null;
}
