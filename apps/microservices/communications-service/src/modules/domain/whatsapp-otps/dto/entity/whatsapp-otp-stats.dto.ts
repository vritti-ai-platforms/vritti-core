export class WhatsappOtpStatsDto {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
  verificationRate: number;
  byDay: WhatsappOtpDailyPointDto[];
  byApp: WhatsappOtpAppBreakdownDto[];
}

export class WhatsappOtpDailyPointDto {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  verified: number;
  failed: number;
}

export class WhatsappOtpAppBreakdownDto {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}
