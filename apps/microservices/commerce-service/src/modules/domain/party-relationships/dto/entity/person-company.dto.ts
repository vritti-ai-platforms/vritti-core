import type { PartyRelationship } from '@/db/schema';

export class PersonCompanyDto {
  id: string;
  companyId: string;
  companyName: string | null;
  jobTitle: string | null;
  isActive: boolean;

  // Maps a PartyRelationship entity (person as child) to a PersonCompanyDto
  static from(entity: PartyRelationship, companyName: string | null = null): PersonCompanyDto {
    const dto = new PersonCompanyDto();
    dto.id = entity.id;
    dto.companyId = entity.parentPartyId;
    dto.companyName = companyName;
    dto.jobTitle = entity.jobTitle ?? null;
    dto.isActive = entity.isActive;
    return dto;
  }
}
