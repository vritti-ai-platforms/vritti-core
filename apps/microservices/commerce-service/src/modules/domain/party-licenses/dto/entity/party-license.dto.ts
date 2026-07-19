import type { PartyLicense, PartyLicenseType } from '@/db/schema';

export class PartyLicenseDto {
  id: string;
  partyId: string;
  licenseType: PartyLicenseType;
  licenseNumber: string;
  region: string | null;
  validTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a PartyLicense entity to a PartyLicenseDto
  static from(entity: PartyLicense): PartyLicenseDto {
    const dto = new PartyLicenseDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.licenseType = entity.licenseType;
    dto.licenseNumber = entity.licenseNumber;
    dto.region = entity.region ?? null;
    dto.validTo = entity.validTo ?? null;
    dto.notes = entity.notes ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
