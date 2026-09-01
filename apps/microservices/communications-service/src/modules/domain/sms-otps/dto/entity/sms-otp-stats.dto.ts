export class SmsOtpStatsDto {
  total: number;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
  verificationRate: number;
  byDay: SmsOtpDailyPointDto[];
  byApp: SmsOtpAppBreakdownDto[];
}

export class SmsOtpDailyPointDto {
  date: string;
  sent: number;
  delivered: number;
  verified: number;
  failed: number;
}

export class SmsOtpAppBreakdownDto {
  appId: string;
  sent: number;
  verified: number;
  failed: number;
}
