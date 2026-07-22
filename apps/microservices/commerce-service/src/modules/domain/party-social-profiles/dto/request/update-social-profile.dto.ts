import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type SocialPlatform, SocialPlatformValues } from '@/db/schema';

export class UpdateSocialProfileDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(SocialPlatformValues)
  platform?: SocialPlatform;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url?: string;
}
