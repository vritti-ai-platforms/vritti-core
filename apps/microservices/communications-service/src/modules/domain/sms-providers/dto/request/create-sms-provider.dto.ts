import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { SMS_PROVIDER_CODES, type SmsProviderCode } from '@/db/schema';

// Type is not a field: the org path always creates CLIENT rows, the internal (cloud) path PLATFORM
export class CreateSmsProviderDto {
  @IsIn(SMS_PROVIDER_CODES)
  provider: SmsProviderCode;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // Provider-specific secrets — each registry implementation owns its shape
  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  senderId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
