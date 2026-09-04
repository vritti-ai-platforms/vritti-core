import { Trim } from '@vritti/api-sdk/decorators';
// No accessToken field on purpose: a credential may only be written by the Embedded Signup flow,
// which verifies the grant against Meta first. forbidNonWhitelisted rejects one sent here.
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateWhatsappAccountDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  legalEntityId?: string | null;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
