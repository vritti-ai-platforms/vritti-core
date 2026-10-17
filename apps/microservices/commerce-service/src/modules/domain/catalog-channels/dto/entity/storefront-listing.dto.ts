import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface StorefrontListingRow {
  id: string;
  offeringVariantId: string;
  code: string;
  name: string;
  // The price lateral is an INNER join, so a row exists only because a price does — and the lateral
  // selects the column itself, so the driver's bigint decoder runs and no manual BigInt() is needed.
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
