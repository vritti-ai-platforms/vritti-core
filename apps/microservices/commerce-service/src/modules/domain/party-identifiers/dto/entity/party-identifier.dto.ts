import type { PartyIdentifier, PartyIdentifierType } from '@/db/schema';

export class PartyIdentifierDto {
  id: string;
  partyId: string;
  idType: PartyIdentifierType;
  idValue: string;
  isPrimary: boolean;
  isActive: boolean;
  verifiedAt: string | null;
  createdAt: string;

  // Maps a PartyIdentifier entity to a PartyIdentifierDto
  static from(entity: PartyIdentifier): PartyIdentifierDto {
    const dto = new PartyIdentifierDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.idType = entity.idType;
    dto.idValue = entity.idValue;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.verifiedAt = entity.verifiedAt ? entity.verifiedAt.toISOString() : null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
