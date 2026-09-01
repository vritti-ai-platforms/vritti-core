import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

// The provider code is immutable — switching vendors is a new row, not an edit
export class UpdateSmsProviderDto {
  @ApiPropertyOptional({ example: 'CampX Twilio' })
  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Full replacement of the provider-specific secrets when present' })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  credentials?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Default originator (sender id / from number)' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  senderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
