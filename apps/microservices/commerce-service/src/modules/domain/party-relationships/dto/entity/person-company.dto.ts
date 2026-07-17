import type { PartyRelationship } from '@/db/schema';

export class PersonCompanyDto {
  id: string;
  companyId: string;
  companyName: string | null;
  countryCode: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  isActive: boolean;

  // Maps a PartyRelationship entity (person as child) to a PersonCompanyDto
  static from(
    entity: PartyRelationship,
    companyName: string | null = null,
    countryCode: string | null = null,
  ): PersonCompanyDto {
    const dto = new PersonCompanyDto();
    dto.id = entity.id;
    dto.companyId = entity.parentPartyId;
    dto.companyName = companyName;
    dto.countryCode = countryCode;
    dto.jobTitle = entity.jobTitle ?? null;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    return dto;
  }
}
