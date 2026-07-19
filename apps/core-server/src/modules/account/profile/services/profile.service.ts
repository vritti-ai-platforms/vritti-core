import { UserDomainService } from '@domain/user/services/user.service';
import { Injectable } from '@nestjs/common';
import { ProfileDto } from '../dto/entity/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserDomainService) {}

  // Returns the authenticated user's profile
  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return ProfileDto.from(user);
  }
}
