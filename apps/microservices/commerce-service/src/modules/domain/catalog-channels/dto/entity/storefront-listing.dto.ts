import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface StorefrontListingRow {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  name: string | null;
  priceCurrency: string | null;
  priceAmount: string | null;
}

export class StorefrontListingDto {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  name: string | null;
  price: CurrencyAmountDto | null;

  static from(row: StorefrontListingRow): StorefrontListingDto {
    const dto = new StorefrontListingDto();
    dto.id = row.id;
    dto.offeringVariantId = row.offeringVariantId;
    dto.sku = row.sku ?? null;
    dto.name = row.name ?? null;
    dto.price =
      row.priceCurrency && row.priceAmount ? CurrencyAmountDto.from(BigInt(row.priceAmount), row.priceCurrency) : null;
    return dto;
  }
}

export class StorefrontListingsDto {
  items: StorefrontListingDto[];
  total: number;
  page: number;
  perPage: number;
}
