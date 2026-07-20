import type { PartyContact, PartyContactPurpose } from '@/db/schema';

export class PartyContactDto {
  id: string;
  partyId: string;
  purpose: PartyContactPurpose;
  label: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a PartyContact entity to a PartyContactDto
  static from(entity: PartyContact): PartyContactDto {
    const dto = new PartyContactDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.purpose = entity.purpose;
    dto.label = entity.label ?? null;
    dto.name = entity.name ?? null;
    dto.email = entity.email ?? null;
    dto.phone = entity.phone ?? null;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
