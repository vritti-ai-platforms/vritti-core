import { Injectable } from '@nestjs/common';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import { type InventoryItemMrp, uom } from '@/db/schema';
import type { AddInventoryItemMrpDto } from '../dto/request/add-inventory-item-mrp.dto';
import type { UpdateInventoryItemMrpDto } from '../dto/request/update-inventory-item-mrp.dto';
import {
  InventoryItemMrpsDomainRepository,
  type InventoryItemMrpWithUom,
} from '../repositories/inventory-item-mrps.repository';

@Injectable()
export class InventoryItemMrpsDomainService {
  constructor(private readonly repository: InventoryItemMrpsDomainRepository) {}

  // The options the Add Listings form offers for one variant, labelled the way a pack is read
  async findForSelect(
    query: SelectOptionsQueryDto & { variantId: string; currencyCode?: string; catalogId?: string },
  ): Promise<SelectQueryResult> {
    const result = await this.repository.findForVariantSelect(query.variantId, query.currencyCode, query.catalogId, {
      value: query.valueKey || 'id',
      label: query.labelKey || 'amount',
      additionalKeys: ['currencyCode', 'isCurrent', 'uomId'],
      additionalExpressions: { uomSymbol: sql`${uom.symbol}` },
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'amount',
      orderDirection: query.orderDirection || 'asc',
    });

    // The label is built here rather than in the browser: an amount is minor units and a currency decides
    // how many decimals it has, so formatting it anywhere else is a second place to get a pack's price wrong
    return {
      ...result,
      options: result.options.map((option) => {
        const currencyCode = String(option.additionals?.currencyCode ?? '') as CurrencyCode;
        const symbol = option.additionals?.uomSymbol;
        // The code rather than a symbol: a multi-select renders its options as plain strings, so there is
        // no locale here to place a "₹" with — and the admin screens quote currencies by code anyway. It is
        // dropped when the caller named a currency, since then every option is in it.
        const major = minorToMajor(BigInt(String(option.label)), currencyCode);
        const amount = query.currencyCode ? major : `${currencyCode} ${major}`;
        return {
          ...option,
          label: symbol ? `${amount} / ${symbol}` : amount,
          description: option.additionals?.isCurrent ? 'Currently printed' : 'Older stock',
        };
      }),
    };
  }

  // Records the latest suggested MRP for an (item, uom, currency); called when a goods receipt is published.
  upsert(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    return this.repository.upsert(inventoryItemId, uomId, currencyCode, amount, sourceLotId);
  }

  // Inserts a new suggested MRP for an (item, uom, currency); the unique constraint surfaces conflicts
  async create(dto: AddInventoryItemMrpDto): Promise<InventoryItemMrp> {
    const currencyCode = dto.amount.currency;
    const amount = majorToMinor(dto.amount.value, currencyCode, 'amount');
    const row = await this.repository.createMrp(dto.inventoryItemId, dto.uomId, currencyCode, amount);
    const total = await this.repository.countForTriple(dto.inventoryItemId, dto.uomId, currencyCode);
    if (total === 1) return (await this.repository.setCurrent(row.id)) ?? row;
    return row;
  }

  // Promotes one recorded MRP to the current one for its triple; resolves undefined when none matched
  setCurrent(id: string): Promise<InventoryItemMrp | undefined> {
    return this.repository.setCurrent(id);
  }

  // Updates an existing MRP row's amount by id; resolves undefined when no row matched
  updateAmount(dto: UpdateInventoryItemMrpDto): Promise<InventoryItemMrp | undefined> {
    const amount = majorToMinor(dto.amount.value, dto.amount.currency, 'amount');
    return this.repository.updateAmount(dto.id, amount);
  }

  // Deletes an MRP row by id; resolves the deleted row or undefined when none matched
  delete(id: string): Promise<InventoryItemMrp | undefined> {
    return this.repository.deleteOne(id);
  }

  // Returns the suggested MRPs for an inventory item (one per uom×currency)
  findByItem(inventoryItemId: string): Promise<InventoryItemMrpWithUom[]> {
    return this.repository.findByItem(inventoryItemId);
  }

  // Returns true when the uom shares the item's primary-uom family
  isUomInItemFamily(inventoryItemId: string, uomId: string): Promise<boolean> {
    return this.repository.isUomInItemFamily(inventoryItemId, uomId);
  }
}
