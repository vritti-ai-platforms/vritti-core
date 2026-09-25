import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface CatalogListingRow {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  legalEntityId: string | null;
  inventoryItemMrpId: string | null;
  sku: string | null;
  variantName: string | null;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  mrpUomSymbol: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogListingPriceRow {
  id: string;
  catalogListingId: string;
  currencyCode: string;
  amount: bigint;
  siteId: string | null;
}

export class CatalogListingPriceDto {
  id: string;
  siteId: string | null;
  price: CurrencyAmountDto;

  static from(row: CatalogListingPriceRow): CatalogListingPriceDto {
    const dto = new CatalogListingPriceDto();
    dto.id = row.id;
    dto.siteId = row.siteId ?? null;
    dto.price = CurrencyAmountDto.from(row.amount, row.currencyCode);
    return dto;
  }
}

export class CatalogListingDto {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  legalEntityId: string | null;
  inventoryItemMrpId: string | null;
  mrp: CurrencyAmountDto | null;
  mrpUomSymbol: string | null;
  hiddenChannelIds: string[];
  prices: CatalogListingPriceDto[];
  createdAt: string;
  updatedAt: string;

  static from(
    row: CatalogListingRow,
    prices: CatalogListingPriceRow[] = [],
    hiddenChannelIds: string[] = [],
  ): CatalogListingDto {
    const dto = new CatalogListingDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.sku = row.sku ?? null;
    dto.variantName = row.variantName ?? null;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.inventoryItemMrpId = row.inventoryItemMrpId ?? null;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.mrpUomSymbol = row.mrpUomSymbol ?? null;
    dto.hiddenChannelIds = hiddenChannelIds;
    dto.prices = prices.map((price) => CatalogListingPriceDto.from(price));
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export interface MrpOptionRow {
  id: string;
  amount: bigint;
  currencyCode: string;
  uomSymbol: string | null;
  isCurrent: boolean;
}

export class CatalogListingMrpOptionDto {
  id: string;
  mrp: CurrencyAmountDto;
  uomSymbol: string | null;
  isCurrent: boolean;

  static from(row: MrpOptionRow): CatalogListingMrpOptionDto {
    const dto = new CatalogListingMrpOptionDto();
    dto.id = row.id;
    dto.mrp = CurrencyAmountDto.from(row.amount, row.currencyCode);
    dto.uomSymbol = row.uomSymbol ?? null;
    dto.isCurrent = row.isCurrent;
    return dto;
  }
}
