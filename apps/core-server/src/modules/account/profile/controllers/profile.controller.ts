import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { ApiGetProfile } from '../docs/profile.docs';
import { ProfileDto } from '../dto/entity/profile.dto';
import { ProfileService } from '../services/profile.service';

@ApiTags('Account - Profile')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  // Returns the authenticated user's profile
  @Get()
  @ApiGetProfile()
  async getProfile(@UserId() userId: string): Promise<ProfileDto> {
    this.logger.log(`GET /account/profile - userId: ${userId}`);
    return this.profileService.getProfile(userId);
  }
}
