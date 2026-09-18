import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class SendSmsOtpDto {
  @IsUUID()
  appId: string;

  // The sms_providers row to deliver through — platform or the org's own
  @IsUUID()
  providerId: string;

  // The provider's template the code is rendered into. Required by providers whose transport
  // declares requiresTemplate; absent for the console transport.
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  templateId?: string;

  // Per-app override of the provider row's default originator
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  senderId?: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsInt()
  @Min(4)
  @Max(10)
  codeLength: number;

  @IsInt()
  @Min(30)
  @Max(3600)
  expirySeconds: number;

  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts: number;

  @IsInt()
  @Min(0)
  @Max(3600)
  resendCooldownSeconds: number;
}
