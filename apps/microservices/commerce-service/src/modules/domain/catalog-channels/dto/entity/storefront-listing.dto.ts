import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { VariantFacet } from '@/db/schema';

export interface StorefrontListingRow {
  id: string;
  offeringVariantId: string;
  code: string;
  name: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  priceCurrency: string;
  priceAmount: bigint;
}

export class StorefrontListingDto {
  id: string;
  offeringVariantId: string;
  code: string;
  // The offering's name — a variant has none of its own. The facets are what tell it from its siblings.
  name: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  price: CurrencyAmountDto;

  static from(row: StorefrontListingRow): StorefrontListingDto {
    const dto = new StorefrontListingDto();
    dto.id = row.id;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.name = row.name;
    dto.dimensions = row.dimensions;
    dto.attributes = row.attributes;
    dto.price = CurrencyAmountDto.from(row.priceAmount, row.priceCurrency);
    return dto;
  }
}

export class StorefrontListingsDto {
  items: StorefrontListingDto[];
  total: number;
  page: number;
  perPage: number;
}
