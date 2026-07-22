import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  X: 'X',
  YOUTUBE: 'YOUTUBE',
  TIKTOK: 'TIKTOK',
  WEBSITE: 'WEBSITE',
} as const;

export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[keyof typeof SOCIAL_PLATFORMS];

export class CreatePartySocialProfileDto {
  @ApiProperty({ description: 'Social platform', enum: SOCIAL_PLATFORMS })
  @IsEnum(SOCIAL_PLATFORMS)
  platform: SocialPlatformValue;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Profile URL or handle', example: 'https://instagram.com/acmefoods' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}
