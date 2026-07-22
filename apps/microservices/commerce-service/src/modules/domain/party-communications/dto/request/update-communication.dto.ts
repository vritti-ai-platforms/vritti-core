import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PartyCommunicationAppInput } from './party-communication-app-input.dto';

export class UpdateCommunicationDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value?: string;

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
