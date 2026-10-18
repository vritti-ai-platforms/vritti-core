import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface StorefrontListingRow {
  id: string;
  offeringVariantId: string;
  code: string;
  name: string;
  priceCurrency: string;
  priceAmount: bigint;
}

export class StorefrontListingDto {
  id: string;
  offeringVariantId: string;
  code: string;
  name: string;
  price: CurrencyAmountDto;

  static from(row: StorefrontListingRow): StorefrontListingDto {
    const dto = new StorefrontListingDto();
    dto.id = row.id;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.name = row.name;
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
