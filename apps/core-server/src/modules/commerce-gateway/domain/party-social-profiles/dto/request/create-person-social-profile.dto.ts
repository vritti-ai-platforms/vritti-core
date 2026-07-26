import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SOCIAL_PLATFORMS, type SocialPlatformValue } from './social-platform.constants';

export class CreatePersonSocialProfileDto {
  @ApiProperty({ description: 'Social platform', enum: SOCIAL_PLATFORMS })
  @IsEnum(SOCIAL_PLATFORMS)
  platform: SocialPlatformValue;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Profile URL or handle', example: 'https://instagram.com/priya.sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}
