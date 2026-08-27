import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

export const WHATSAPP_OTP_STATUSES = ['SENT', 'DELIVERED', 'READ', 'VERIFIED', 'FAILED'] as const;

export type WhatsappOtpStatus = (typeof WHATSAPP_OTP_STATUSES)[number];

export interface WhatsappOtpData {
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
}

export type WhatsappOtpsTableResponse = TableResponse<WhatsappOtpData>;

export interface ConfiguredOtpAppData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  accountId: string;
  templateName: string;
  expirySeconds: number;
}

export interface WhatsappOtpDailyPoint {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
}

export interface WhatsappOtpAppBreakdown {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}

export interface WhatsappOtpStatsData {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
  verificationRate: number;
  byDay: WhatsappOtpDailyPoint[];
  byApp: WhatsappOtpAppBreakdown[];
}
