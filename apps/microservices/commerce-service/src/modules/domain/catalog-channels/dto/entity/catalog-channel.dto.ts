import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CatalogChannelType, CatalogFilterMode } from '@/db/schema';

export type ChannelScope = 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';

const scopeOf = (row: CatalogChannelRow): ChannelScope =>
  row.siteId ? 'SITE' : row.legalEntityId ? 'LEGAL_ENTITY' : 'ORGANIZATION';

export interface CatalogChannelRow {
  id: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  catalogTaxInclusive: boolean;
  catalogFilterMode: CatalogFilterMode;
  type: CatalogChannelType;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// The list is the only read that prints "x of y items", and both are correlated subqueries, so it
// is the only one that selects them
export interface ChannelListRow extends CatalogChannelRow {
  itemsTotal: number;
  itemsSelling: number;
}

// One catalog as a channel serves it: a channel's default, or one app's or terminal's exception.
// ownerScope / legalEntityId / siteId are what the gateway's OwnerNameService resolves names from.
export class ChannelCatalogDto {
  channelId: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: 'ORG' | 'LE' | 'SITE';
  isOwn: boolean;
  itemsTotal: number;
  itemsSelling: number;

  static from(row: ChannelListRow): ChannelCatalogDto {
    const dto = new ChannelCatalogDto();
    dto.channelId = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName;
    dto.catalogIsActive = row.catalogIsActive;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = row.siteId ? 'SITE' : row.legalEntityId ? 'LE' : 'ORG';
    dto.isOwn = row.isOwn;
    dto.itemsTotal = row.itemsTotal;
    dto.itemsSelling = row.itemsSelling;
    return dto;
  }
}

export const DEFAULT_SLOT = 'default';

export type ResolvedChannelsDto = Record<string, Record<string, ChannelCatalogDto>>;

export class CatalogChannelDto {
  id: string;
  catalogId: string;
  catalogName: string;
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
  createdAt: string;
  updatedAt: string;

  static from(row: CatalogChannelRow): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName;
    dto.catalogIsActive = row.catalogIsActive;
    dto.type = row.type;
    dto.isFallback = !row.appId && !row.terminalId;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.appId = row.appId ?? null;
    dto.terminalId = row.terminalId ?? null;
    dto.terminalName = row.terminalName ?? null;
    dto.isOwn = row.isOwn;
    dto.setAt = scopeOf(row);
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

// Asking is not failing: an operator inspecting an unconfigured channel gets an answer, not an error.
// Real callers use resolve(), which throws — a storefront with no catalog must not look "in stock".
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
    dto.catalogName = row.catalogName;
    dto.taxInclusive = row.catalogTaxInclusive;
    dto.channelId = row.id;
    dto.matchedScope = scopeOf(row);
    dto.matchedTarget = Boolean(row.appId || row.terminalId);
    return dto;
  }
}
