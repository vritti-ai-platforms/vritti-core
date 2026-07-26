import { ApiProperty } from '@nestjs/swagger';
import { SOCIAL_PLATFORMS, type SocialPlatformValue } from '../request/social-platform.constants';

export class PartySocialProfileResponseDto {
  @ApiProperty({ description: 'Social profile ID' })
  id: string;

  @ApiProperty({ description: 'The party ID' })
  partyId: string;

  @ApiProperty({ description: 'Social platform', enum: SOCIAL_PLATFORMS })
  platform: SocialPlatformValue;

  @ApiProperty({ description: 'Profile URL or handle', example: 'https://instagram.com/acmefoods' })
  url: string;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
