import type { PartyRelationship } from '@/db/schema';

export class PartyRelationshipDto {
  id: string;
  parentPartyId: string;
  childPartyId: string;
  childName: string | null;
  jobTitle: string | null;
  secondaryPhone: string | null;
  secondaryEmail: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a PartyRelationship entity to a PartyRelationshipDto
  static from(entity: PartyRelationship, childName: string | null = null): PartyRelationshipDto {
    const dto = new PartyRelationshipDto();
    dto.id = entity.id;
    dto.parentPartyId = entity.parentPartyId;
    dto.childPartyId = entity.childPartyId;
    dto.childName = childName;
    dto.jobTitle = entity.jobTitle ?? null;
    dto.secondaryPhone = entity.secondaryPhone ?? null;
    dto.secondaryEmail = entity.secondaryEmail ?? null;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
