import type { PartyAddress, PartyAddressType } from '@/db/schema';

export class PartyAddressDto {
  id: string;
  partyId: string;
  type: PartyAddressType;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;

  // Maps a PartyAddress entity to a PartyAddressDto
  static from(entity: PartyAddress): PartyAddressDto {
    const dto = new PartyAddressDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.type = entity.type;
    dto.line1 = entity.line1;
    dto.line2 = entity.line2 ?? null;
    dto.city = entity.city ?? null;
    dto.region = entity.region ?? null;
    dto.postalCode = entity.postalCode ?? null;
    dto.countryCode = entity.countryCode;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
