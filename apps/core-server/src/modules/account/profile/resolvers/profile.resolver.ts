import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { Profile } from '../graphql/profile.type';
import { ProfileService } from '../services/profile.service';

@Resolver()
export class ProfileResolver {
  private readonly logger = new Logger(ProfileResolver.name);

  constructor(private readonly profileService: ProfileService) {}

  // Returns the authenticated user's profile
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => Profile, { name: 'profile' })
  async profile(@UserId() userId: string): Promise<Profile> {
    this.logger.log('QUERY profile');
    return this.profileService.getProfile(userId);
  }
}
