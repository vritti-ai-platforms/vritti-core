import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const SMS_PROVIDER_CODES = ['CONSOLE', 'MSG91', 'TWILIO'] as const;
export type SmsProviderCode = (typeof SMS_PROVIDER_CODES)[number];

// Type is not a field: the org API always creates CLIENT rows, the cloud internal path PLATFORM
export class CreateSmsProviderDto {
  @ApiProperty({ enum: SMS_PROVIDER_CODES, description: 'Registry code of the provider implementation' })
  @IsIn(SMS_PROVIDER_CODES)
  provider: SmsProviderCode;

  @ApiProperty({ example: 'CampX Twilio', description: 'Display name, unique within the organization' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // @Type(() => Object) pins the value type so the pipe's implicit conversion leaves the object alone
  @ApiPropertyOptional({
    description: 'Provider-specific secrets — MSG91: { authKey }; TWILIO: { accountSid, authToken }; CONSOLE: none',
  })
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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
