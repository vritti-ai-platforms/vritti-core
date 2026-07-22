import type { PartySocialProfile, SocialPlatform } from '@/db/schema';

export class PartySocialProfileDto {
  id: string;
  partyId: string;
  platform: SocialPlatform;
  url: string;
  createdAt: string;
  updatedAt: string;

  // Maps a PartySocialProfile entity to a PartySocialProfileDto
  static from(entity: PartySocialProfile): PartySocialProfileDto {
    const dto = new PartySocialProfileDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.platform = entity.platform;
    dto.url = entity.url;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
