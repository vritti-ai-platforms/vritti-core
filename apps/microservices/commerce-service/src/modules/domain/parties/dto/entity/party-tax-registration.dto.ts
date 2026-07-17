import type { PartyTaxRegistration, TaxRegistrationType } from '@/db/schema';

export class PartyTaxRegistrationDto {
  id: string;
  partyId: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a PartyTaxRegistration entity to a PartyTaxRegistrationDto
  static from(entity: PartyTaxRegistration, jurisdictionName: string | null = null): PartyTaxRegistrationDto {
    const dto = new PartyTaxRegistrationDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.jurisdictionId = entity.jurisdictionId;
    dto.jurisdictionName = jurisdictionName;
    dto.registrationNumber = entity.registrationNumber;
    dto.registrationType = entity.registrationType;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
