import type { TaxRegistration, TaxRegistrationType } from '@/db/schema';

export class TaxRegistrationDto {
  id: string;
  legalEntityId: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  jurisdictionCode: string | null;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: TaxRegistration & { jurisdictionName?: string | null; jurisdictionCode?: string | null },
  ): TaxRegistrationDto {
    const dto = new TaxRegistrationDto();
    dto.id = entity.id;
    dto.legalEntityId = entity.legalEntityId;
    dto.jurisdictionId = entity.jurisdictionId;
    dto.jurisdictionName = entity.jurisdictionName ?? null;
    dto.jurisdictionCode = entity.jurisdictionCode ?? null;
    dto.registrationNumber = entity.registrationNumber;
    dto.registrationType = entity.registrationType;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
