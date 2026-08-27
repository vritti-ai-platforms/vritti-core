import { ApiProperty } from '@nestjs/swagger';

export class WhatsappOtpDailyPointDto {
  @ApiProperty({ description: 'Day in YYYY-MM-DD' })
  date: string;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty()
  read: number;

  @ApiProperty()
  verified: number;

  @ApiProperty()
  failed: number;
}

export class WhatsappOtpAppBreakdownDto {
  @ApiProperty({ description: 'App credential the codes were issued for' })
  appId: string;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  verified: number;

  @ApiProperty()
  failed: number;
}

export class WhatsappOtpStatsResponseDto {
  @ApiProperty({ description: 'Every code issued in the window' })
  total: number;

  @ApiProperty({ description: 'Accepted by Meta, no delivery confirmation yet' })
  sent: number;

  @ApiProperty({ description: 'Meta confirmed reaching the handset, not yet opened' })
  delivered: number;

  @ApiProperty({ description: 'Opened by the recipient' })
  read: number;

  @ApiProperty({ description: 'Typed back and verified' })
  verified: number;

  @ApiProperty({ description: 'Never reached the recipient' })
  failed: number;

  @ApiProperty({ description: 'Verified as a percentage of total' })
  verificationRate: number;

  @ApiProperty({ type: [WhatsappOtpDailyPointDto] })
  byDay: WhatsappOtpDailyPointDto[];

  @ApiProperty({ type: [WhatsappOtpAppBreakdownDto] })
  byApp: WhatsappOtpAppBreakdownDto[];
}
