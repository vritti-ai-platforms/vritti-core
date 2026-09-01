import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

// No READ — SMS has no read receipts
export const SMS_OTP_STATUSES = ['SENT', 'DELIVERED', 'VERIFIED', 'FAILED'] as const;

export type SmsOtpStatus = (typeof SMS_OTP_STATUSES)[number];

export interface SmsOtpData {
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
}

export type SmsOtpsTableResponse = TableResponse<SmsOtpData>;

export interface ConfiguredSmsOtpAppData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  providerId: string;
  expirySeconds: number;
}

export interface SmsOtpDailyPoint {
  date: string;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
}

export interface SmsOtpAppBreakdown {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}

export interface SmsOtpStatsData {
  total: number;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
  verificationRate: number;
  byDay: SmsOtpDailyPoint[];
  byApp: SmsOtpAppBreakdown[];
}
