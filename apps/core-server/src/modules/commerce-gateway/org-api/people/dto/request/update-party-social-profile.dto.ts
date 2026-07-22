import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SOCIAL_PLATFORMS, type SocialPlatformValue } from './create-party-social-profile.dto';

export class UpdatePartySocialProfileDto {
  @ApiPropertyOptional({ description: 'Social platform', enum: SOCIAL_PLATFORMS })
  @IsOptional()
  @IsEnum(SOCIAL_PLATFORMS)
  platform?: SocialPlatformValue;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Profile URL or handle', example: 'https://instagram.com/acmefoods' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url?: string;
}
