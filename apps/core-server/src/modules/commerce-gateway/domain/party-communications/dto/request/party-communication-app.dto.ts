import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

// Mirrors commerce's `party_communication_channel` enum and must stay identical to it —
// a value missing here cannot be expressed through the gateway at all.
// WEB_APP is not a contact method: its value is a person's id in one of the
// organization's own web apps, so this deployment can resolve that account back to
// the party. A CHECK on the table refuses it as primary.
export const PARTY_COMMUNICATION_CHANNELS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WEB_APP: 'WEB_APP',
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
