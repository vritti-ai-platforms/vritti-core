import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class SetWhatsappOtpConfigDto {
  @ApiProperty({ description: 'WhatsApp account the codes are sent from' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'Meta phone number ID — the sender' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ description: 'Approved AUTHENTICATION template name' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({ description: 'Template language code' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  templateLanguage: string;

  @ApiProperty({ description: 'Digits in the generated code', minimum: 4, maximum: 10 })
  @IsInt()
  @Min(4)
  @Max(10)
  codeLength: number;

  @ApiProperty({ description: 'Seconds a code stays valid', minimum: 30, maximum: 3600 })
  @IsInt()
  @Min(30)
  @Max(3600)
  expirySeconds: number;

  @ApiProperty({ description: 'Guesses allowed before a code is spent', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts: number;

  @ApiProperty({ description: 'Seconds before a new code may be requested', minimum: 0, maximum: 3600 })
  @IsInt()
  @Min(0)
  @Max(3600)
  resendCooldownSeconds: number;
}
