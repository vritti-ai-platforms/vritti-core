import type { FilePayload } from '@domain/media/services/media.service';
import { MediaDomainService } from '@domain/media/services/media.service';
import { UserDomainService } from '@domain/user/services/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { ProfileDto } from '../dto/entity/profile.dto';
import { ProfilePhotoDto } from '../dto/response/profile-photo.dto';

// The photo is attached to the user through the media module's entity link rather than a column on `users`. Media
// already enforces one object per entity and replaces it on re-upload, so the link cannot go stale the way a
// foreign key would when the object is deleted from the other side.
const PHOTO_ENTITY_TYPE = 'user';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly userService: UserDomainService,
    private readonly mediaService: MediaDomainService,
  ) {}

  // Returns the authenticated user's profile
  async getProfile(userId: string, organizationId: string): Promise<ProfileDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    const photo = await this.mediaService.getUrlForEntity(organizationId, PHOTO_ENTITY_TYPE, userId);
    return ProfileDto.from(user, photo?.url ?? null);
  }

  // Stores a new profile photo, replacing any existing one. Media handles the replacement itself — it deletes whatever
  // is currently linked to this entity before writing the new object — so there is nothing to clean up here.
  async uploadPhoto(userId: string, organizationId: string, file: FilePayload): Promise<ProfilePhotoDto> {
    const media = await this.mediaService.upload(file, organizationId, userId, {
      entityType: PHOTO_ENTITY_TYPE,
      entityId: userId,
    });

    const { url, expiresIn } = await this.mediaService.getPresignedUrl(media.id);
    this.logger.log(`Profile photo updated for user ${userId} (media ${media.id})`);

    return ProfilePhotoDto.from(media.id, url, expiresIn);
  }

  // Removes the profile photo. Idempotent — removing when there is none is not an error.
  async removePhoto(userId: string, organizationId: string): Promise<void> {
    await this.mediaService.deleteForEntity(organizationId, PHOTO_ENTITY_TYPE, userId);
    this.logger.log(`Profile photo removed for user ${userId}`);
  }
}
