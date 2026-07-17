import type { Party, PartyType } from '@/db/schema';

export class PartyDto {
  id: string;
  organizationId: string;
  partyType: PartyType;
  displayName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  legalName: string | null;
  jurisdictionId: string | null;
  website: string | null;
  firstName: string | null;
  lastName: string | null;
  countryCode: string | null;
  createdAt: string;
  updatedAt: string;

  // Maps a Party entity to a PartyDto
  static from(entity: Party): PartyDto {
    const dto = new PartyDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.partyType = entity.partyType;
    dto.displayName = entity.displayName;
    dto.email = entity.email ?? null;
    dto.phone = entity.phone ?? null;
    dto.address = entity.address ?? null;
    dto.isActive = entity.isActive;
    dto.legalName = entity.legalName ?? null;
    dto.jurisdictionId = entity.jurisdictionId ?? null;
    dto.website = entity.website ?? null;
    dto.firstName = entity.firstName ?? null;
    dto.lastName = entity.lastName ?? null;
    dto.countryCode = entity.countryCode ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
