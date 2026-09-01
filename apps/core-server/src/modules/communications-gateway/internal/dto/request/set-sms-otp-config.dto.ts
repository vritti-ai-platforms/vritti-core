import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class SetSmsOtpConfigDto {
  @ApiProperty({ description: "SMS provider the codes are sent through — platform or the org's own" })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({ description: "Per-app override of the provider row's default originator" })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  senderId?: string;

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
