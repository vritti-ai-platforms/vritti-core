import type { Party, PartyAddress, PartyType } from '@/db/schema';
import type { PartyMainLineContact } from './company.dto';
import { type PartyPrimaryAddressDto, toPrimaryAddressDto } from './party.dto';

export class PersonDto {
  id: string;
  partyType: PartyType;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  canDelete: boolean;
  primaryAddress: PartyPrimaryAddressDto | null;
  createdAt: string;
  updatedAt: string;

  // Maps a PERSON party entity to a PersonDto; email/phone come from the primary EMAIL/PHONE communications
  static from(
    entity: Party,
    contact?: PartyMainLineContact | null,
    primaryAddress?: PartyAddress | null,
    canDelete = true,
  ): PersonDto {
    const dto = new PersonDto();
    dto.id = entity.id;
    dto.partyType = entity.partyType;
    dto.displayName = entity.displayName;
    dto.firstName = entity.firstName ?? null;
    dto.lastName = entity.lastName ?? null;
    dto.email = contact?.email ?? null;
    dto.phone = contact?.phone ?? null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.primaryAddress = toPrimaryAddressDto(primaryAddress);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
