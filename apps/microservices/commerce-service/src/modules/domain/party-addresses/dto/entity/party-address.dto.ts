import type { PartyAddress, PartyFunctionType } from '@/db/schema';

export interface PartyAddressFunction {
  function: PartyFunctionType;
  isPrimary: boolean;
}

export interface PartyAddressWithFunctions extends PartyAddress {
  functions: PartyAddressFunction[];
}

export class PartyAddressDto {
  id: string;
  partyId: string;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  isActive: boolean;
  functions: PartyAddressFunction[];
  createdAt: string;

  // Maps a PartyAddress entity (with any aggregated functions) to a PartyAddressDto
  static from(entity: PartyAddress | PartyAddressWithFunctions): PartyAddressDto {
    const dto = new PartyAddressDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.line1 = entity.line1;
    dto.line2 = entity.line2 ?? null;
    dto.city = entity.city ?? null;
    dto.region = entity.region ?? null;
    dto.postalCode = entity.postalCode ?? null;
    dto.countryCode = entity.countryCode;
    dto.isActive = entity.isActive;
    dto.functions = 'functions' in entity ? (entity.functions ?? []) : [];
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
