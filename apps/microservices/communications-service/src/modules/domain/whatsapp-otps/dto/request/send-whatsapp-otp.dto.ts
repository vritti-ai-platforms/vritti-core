import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class SendWhatsappOtpDto {
  @IsUUID()
  appId: string;

  @IsUUID()
  accountId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  templateLanguage: string;

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
