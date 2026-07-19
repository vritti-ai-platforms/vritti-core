import type { Party, PartyAddress, PartyType } from '@/db/schema';
import { type PartyPrimaryAddressDto, toPrimaryAddressDto } from './party.dto';

export class CompanyDto {
  id: string;
  partyType: PartyType;
  displayName: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  jurisdictionId: string | null;
  isActive: boolean;
  canDelete: boolean;
  primaryAddress: PartyPrimaryAddressDto | null;
  createdAt: string;
  updatedAt: string;

  // Maps a COMPANY party entity to a CompanyDto; primaryAddress + canDelete are populated only on detail reads
  static from(entity: Party, primaryAddress?: PartyAddress | null, canDelete = true): CompanyDto {
    const dto = new CompanyDto();
    dto.id = entity.id;
    dto.partyType = entity.partyType;
    dto.displayName = entity.displayName;
    dto.legalName = entity.legalName ?? null;
    dto.email = entity.email ?? null;
    dto.phone = entity.phone ?? null;
    dto.website = entity.website ?? null;
    dto.jurisdictionId = entity.jurisdictionId ?? null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.primaryAddress = toPrimaryAddressDto(primaryAddress);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
