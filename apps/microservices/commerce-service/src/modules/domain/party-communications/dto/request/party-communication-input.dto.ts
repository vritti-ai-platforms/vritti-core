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
import { type PartyCommunicationChannel, PartyCommunicationChannelValues } from '@/db/schema';
import { PartyCommunicationAppInput } from './party-communication-app-input.dto';

export class PartyCommunicationInputDto {
  @IsEnum(PartyCommunicationChannelValues)
  channel: PartyCommunicationChannel;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyCommunicationAppInput)
  apps?: PartyCommunicationAppInput[];
}
