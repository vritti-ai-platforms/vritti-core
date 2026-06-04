import { Injectable } from '@nestjs/common';
import { UserService } from '@domain/user/services/user.service';
import { ProfileDto } from '../dto/entity/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserService) {}

  // Returns the authenticated user's profile
  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return ProfileDto.from(user);
  }
}
