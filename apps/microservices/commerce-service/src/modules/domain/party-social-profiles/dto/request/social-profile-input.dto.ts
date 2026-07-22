import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { type SocialPlatform, SocialPlatformValues } from '@/db/schema';

export class SocialProfileInputDto {
  @IsEnum(SocialPlatformValues)
  platform: SocialPlatform;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}
