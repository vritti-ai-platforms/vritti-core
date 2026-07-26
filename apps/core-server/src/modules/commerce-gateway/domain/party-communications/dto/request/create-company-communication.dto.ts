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
import {
  PARTY_COMMUNICATION_CHANNELS,
  PartyCommunicationAppDto,
  type PartyCommunicationChannelValue,
} from './party-communication-app.dto';

export class CreateCompanyCommunicationDto {
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
