import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CatalogChannelType } from '@/db/schema';

export type ChannelScope = 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';

const scopeOf = (row: CatalogChannelRow): ChannelScope =>
  row.siteId ? 'SITE' : row.legalEntityId ? 'LEGAL_ENTITY' : 'ORGANIZATION';

export interface CatalogChannelRow {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean | null;
  catalogTaxInclusive: boolean | null;
  type: CatalogChannelType;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  itemsTotal: number;
  itemsSelling: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CatalogChannelDto {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean;
  type: CatalogChannelType;
  isFallback: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  setAt: ChannelScope;
  itemsTotal: number;
  itemsSelling: number;
  createdAt: string;
  updatedAt: string;

  static from(row: CatalogChannelRow): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName ?? null;
    dto.catalogIsActive = row.catalogIsActive ?? false;
    dto.type = row.type;
    dto.isFallback = !row.appId && !row.terminalId;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.appId = row.appId ?? null;
    dto.terminalId = row.terminalId ?? null;
    dto.terminalName = row.terminalName ?? null;
    dto.isOwn = row.isOwn;
    dto.setAt = scopeOf(row);
    dto.itemsTotal = row.itemsTotal;
    dto.itemsSelling = row.itemsSelling;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export interface ChannelItemRow {
  listingId: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  priceAmount: bigint | null;
  priceCurrencyCode: string | null;
  sellsHere: boolean;
}

export class ChannelItemDto {
  listingId: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  mrp: CurrencyAmountDto | null;
  price: CurrencyAmountDto | null;
  sellsHere: boolean;

  static from(row: ChannelItemRow): ChannelItemDto {
    const dto = new ChannelItemDto();
    dto.listingId = row.listingId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.sku = row.sku ?? null;
    dto.variantName = row.variantName ?? null;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.price =
      row.priceAmount != null && row.priceCurrencyCode
        ? CurrencyAmountDto.from(row.priceAmount, row.priceCurrencyCode)
        : null;
    dto.sellsHere = row.sellsHere;
    return dto;
  }
}

export class ChannelOverviewDto {
  type: CatalogChannelType;
  catalogId: string | null;
  catalogName: string | null;
  catalogIsActive: boolean | null;
  isOverride: boolean;
  inheritedFrom: ChannelScope | null;

  static from(type: CatalogChannelType, row?: CatalogChannelRow): ChannelOverviewDto {
    const dto = new ChannelOverviewDto();
    dto.type = type;
    dto.catalogId = row?.catalogId ?? null;
    dto.catalogName = row?.catalogName ?? null;
    dto.catalogIsActive = row?.catalogIsActive ?? null;
    dto.isOverride = row?.isOwn ?? false;
    dto.inheritedFrom = !row || row.isOwn ? null : scopeOf(row);
    return dto;
  }
}

// Asking is not failing: an operator inspecting an unconfigured channel gets an answer, not an error.
// Real callers use resolve(), which throws — a storefront with no catalog must not look "in stock".
export class ChannelResolutionDto {
  resolved: boolean;
  catalog: ResolvedCatalogDto | null;

  static from(row?: CatalogChannelRow): ChannelResolutionDto {
    const dto = new ChannelResolutionDto();
    dto.resolved = Boolean(row);
    dto.catalog = row ? ResolvedCatalogDto.from(row) : null;
    return dto;
  }
}

export class ResolvedCatalogDto {
  catalogId: string;
  catalogName: string;
  taxInclusive: boolean;
  channelId: string;
  matchedScope: ChannelScope;
  matchedTarget: boolean;

  static from(row: CatalogChannelRow): ResolvedCatalogDto {
    const dto = new ResolvedCatalogDto();
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName ?? '';
    dto.taxInclusive = row.catalogTaxInclusive ?? false;
    dto.channelId = row.id;
    dto.matchedScope = scopeOf(row);
    dto.matchedTarget = Boolean(row.appId || row.terminalId);
    return dto;
  }
}
