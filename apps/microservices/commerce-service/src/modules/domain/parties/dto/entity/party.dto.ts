import type { PartyAddress } from '@/db/schema';

export interface PartyPrimaryAddressDto {
  id: string;
  type: string;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
}

// Maps a party address entity to the primary-address DTO shape, or null when absent
export function toPrimaryAddressDto(address: PartyAddress | null | undefined): PartyPrimaryAddressDto | null {
  if (!address) return null;
  return {
    id: address.id,
    type: address.type,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    region: address.region ?? null,
    postalCode: address.postalCode ?? null,
    countryCode: address.countryCode,
  };
}
