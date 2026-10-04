import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface StorefrontListingRow {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  name: string | null;
  priceCurrency: string | null;
  priceAmount: string | null;
}

/**
 * One item a storefront sells, resolved through its own APP channel.
 *
 * Deliberately narrow: a storefront shows a name and a price, so nothing about who may edit the
 * listing, its MRP slice or which other channels hide it crosses the wire.
 */
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
