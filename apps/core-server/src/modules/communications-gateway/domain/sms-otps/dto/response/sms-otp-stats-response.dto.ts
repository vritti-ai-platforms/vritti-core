import { ApiProperty } from '@nestjs/swagger';

export class SmsOtpDailyPointResponseDto {
  @ApiProperty({ example: '2026-09-01' })
  date: string;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty()
  verified: number;

  @ApiProperty()
  failed: number;
}

export class SmsOtpAppBreakdownResponseDto {
  @ApiProperty({ description: 'App credential ID' })
  appId: string;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  verified: number;

  @ApiProperty()
  failed: number;
}

// No `read` bucket — SMS has no read receipts
export class SmsOtpStatsResponseDto {
  @ApiProperty({ description: 'Codes issued in the window' })
  total: number;

  @ApiProperty({ description: 'Sent but not yet delivered, verified, or failed' })
  sent: number;

  @ApiProperty({ description: 'Delivered but not verified' })
  delivered: number;

  @ApiProperty({ description: 'Successfully verified' })
  verified: number;

  @ApiProperty({ description: 'Failed to send or deliver' })
  failed: number;

  @ApiProperty({ description: 'verified / total, as a whole percentage' })
  verificationRate: number;

  @ApiProperty({ type: [SmsOtpDailyPointResponseDto] })
  byDay: SmsOtpDailyPointResponseDto[];

  @ApiProperty({ type: [SmsOtpAppBreakdownResponseDto] })
  byApp: SmsOtpAppBreakdownResponseDto[];
}
