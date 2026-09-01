import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SmsOtpStatusValues = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

export type SmsOtpStatus = (typeof SmsOtpStatusValues)[keyof typeof SmsOtpStatusValues];

export class ConfiguredSmsOtpAppResponseDto {
  @ApiProperty({ description: 'App credential ID' })
  id: string;

  @ApiProperty({ description: 'App name as cloud shows it' })
  name: string;

  @ApiProperty({ description: 'App credential type' })
  type: string;

  @ApiProperty({ description: 'Whether the credential is usable' })
  isActive: boolean;

  @ApiProperty({ description: 'SMS provider the codes are sent through' })
  providerId: string;

  @ApiProperty({ description: 'Seconds a code stays valid' })
  expirySeconds: number;
}

export class SmsOtpResponseDto {
  @ApiProperty({ description: 'OTP record ID' })
  id: string;

  @ApiProperty({ description: 'App credential the code was issued for' })
  appId: string;

  @ApiProperty({ description: 'SMS provider row the code was sent through' })
  providerId: string;

  @ApiProperty({ description: 'Provider code, captured at send time' })
  provider: string;

  @ApiProperty({ description: 'Recipient phone number in E.164' })
  recipient: string;

  @ApiProperty({ enum: SmsOtpStatusValues, description: 'Derived from delivery, verification, and expiry' })
  status: SmsOtpStatus;

  @ApiProperty({ description: 'Verification attempts made against this code' })
  attempts: number;

  @ApiProperty({ description: 'Whether the code was successfully verified' })
  isVerified: boolean;

  @ApiPropertyOptional({ description: "The vendor's message ID; null for the console transport or a failed send" })
  messageId: string | null;

  @ApiPropertyOptional({ description: 'Why the send or delivery failed' })
  error: string | null;

  @ApiPropertyOptional({ description: "The vendor's raw delivery status" })
  deliveryStatus: string | null;

  @ApiPropertyOptional({ description: 'When the vendor confirmed delivery' })
  deliveredAt: string | null;

  @ApiProperty({ description: 'When the code stops being accepted' })
  expiresAt: string;

  @ApiProperty({ description: 'When the code was issued' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'When the code was verified' })
  verifiedAt: string | null;
}
