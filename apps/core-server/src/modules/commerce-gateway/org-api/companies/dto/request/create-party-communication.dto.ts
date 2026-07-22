import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class CreatePartyCommunicationDto {
  @ApiProperty({ description: 'Communication channel', enum: PARTY_COMMUNICATION_CHANNELS })
  @IsEnum(PARTY_COMMUNICATION_CHANNELS)
  channel: PartyCommunicationChannelValue;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'The email address or phone number', example: 'priya@acme.in' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary value for its channel' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the communication is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [PartyCommunicationAppDto],
    description: 'Messaging apps reachable on this number (phone only)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyCommunicationAppDto)
  apps?: PartyCommunicationAppDto[];
}
