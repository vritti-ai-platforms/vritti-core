import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export const PARTY_COMMUNICATION_CHANNELS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
} as const;

export type PartyCommunicationChannelValue =
  (typeof PARTY_COMMUNICATION_CHANNELS)[keyof typeof PARTY_COMMUNICATION_CHANNELS];

export const MESSAGING_APPS = {
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
  SIGNAL: 'SIGNAL',
  IMO: 'IMO',
  VIBER: 'VIBER',
  WECHAT: 'WECHAT',
} as const;

export type MessagingAppValue = (typeof MESSAGING_APPS)[keyof typeof MESSAGING_APPS];

export class PartyCommunicationAppDto {
  @ApiProperty({ description: 'Messaging app reachable on this number', enum: MESSAGING_APPS })
  @IsEnum(MESSAGING_APPS)
  app: MessagingAppValue;

  @Trim()
  @ApiPropertyOptional({
    description: 'App handle if it differs from the number (e.g. Telegram @username)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  handle?: string | null;
}
