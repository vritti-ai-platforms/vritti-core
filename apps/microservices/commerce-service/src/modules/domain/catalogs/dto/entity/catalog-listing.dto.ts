import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface CatalogListingRow {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  legalEntityId: string | null;
  siteId: string | null;
  isOwned: boolean;
  inventoryItemMrpId: string | null;
  code: string;
  variantName: string;
  isVariantActive: boolean;
  isOfferingActive: boolean;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  mrpUomSymbol: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CatalogListingOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface CatalogListingPriceRow {
  id: string;
  catalogListingId: string;
  currencyCode: string;
  amount: bigint;
  legalEntityId: string | null;
  siteId: string | null;
  isOwned: boolean;
}

export class CatalogListingPriceDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  // The workspace that set this price. A narrower one overrides it without touching it.
  ownerScope: CatalogListingOwnerScope;
  // False when it comes from a wider workspace: this one may override it but never edit it
  canEdit: boolean;
  price: CurrencyAmountDto;

  static from(row: CatalogListingPriceRow): CatalogListingPriceDto {
    const dto = new CatalogListingPriceDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = row.siteId ? 'SITE' : row.legalEntityId ? 'LE' : 'ORG';
    dto.canEdit = row.isOwned;
    dto.price = CurrencyAmountDto.from(row.amount, row.currencyCode);
    return dto;
  }
}

export class CatalogListingDto {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  isVariantActive: boolean;
  isOfferingActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: CatalogListingOwnerScope;
  canEdit: boolean;
  canDelete: boolean;
  inventoryItemMrpId: string | null;
  mrp: CurrencyAmountDto | null;
  mrpUomSymbol: string | null;
  excludedChannelIds: string[];
  prices: CatalogListingPriceDto[];
  createdAt: string;
  updatedAt: string;

  static from(
    row: CatalogListingRow,
    prices: CatalogListingPriceRow[] = [],
    excludedChannelIds: string[] = [],
  ): CatalogListingDto {
    const dto = new CatalogListingDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.variantName = row.variantName;
    dto.isVariantActive = row.isVariantActive;
    dto.isOfferingActive = row.isOfferingActive;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = row.siteId ? 'SITE' : row.legalEntityId ? 'LE' : 'ORG';
    dto.canEdit = row.isOwned;
    dto.canDelete = row.isOwned;
    dto.inventoryItemMrpId = row.inventoryItemMrpId ?? null;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.mrpUomSymbol = row.mrpUomSymbol ?? null;
    dto.excludedChannelIds = excludedChannelIds;
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
