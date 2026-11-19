import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import {
  inventoryItems,
  type Purchase,
  type PurchaseItem,
  type PurchaseItemBucket,
  PurchaseItemBucketValues,
  PurchaseStatusValues,
  purchaseItemBucketCondition,
  purchaseItemDocuments,
  purchaseItemProgress,
  purchaseItems,
} from '@/db/schema';
import { PurchaseItemDto } from '../dto/entity/purchase-item.dto';
import type { PurchaseItemFacets } from '../dto/entity/purchase-item-table-row.dto';
import type { PurchaseItemFieldsDto } from '../dto/request/purchase-item-fields.dto';
import type { UpdatePurchaseItemDto } from '../dto/request/update-purchase-item.dto';
import {
  type PurchaseItemDocumentRow,
  type PurchaseItemRow,
  PurchaseItemsDomainRepository,
  type PurchaseItemTableRow,
  type QuotingScope,
} from '../repositories/purchase-items.repository';

export type ItemsPurchase = Pick<Purchase, 'id' | 'purchaseNumber' | 'status'>;

export type QuotedPurchase = Pick<Purchase, 'id' | 'quotationsRequired' | 'minQuotations'>;

@Injectable()
export class PurchaseItemsDomainService {
  private readonly logger = new Logger(PurchaseItemsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    inventoryItemCode: { column: inventoryItems.sku, type: 'string' },
  };

  constructor(private readonly repository: PurchaseItemsDomainRepository) {}

  // Adds an item the purchase does not have yet to its items, needed by the purchase's date unless it names its own
  async add(purchase: ItemsPurchase, fields: PurchaseItemFieldsDto): Promise<PurchaseItem> {
    this.isPurchaseOpen(purchase);
    const existing = await this.repository.findForInventoryItem(purchase.id, fields.inventoryItemId);
    if (existing) {
      throw new ConflictException({
        label: 'Item Already Added',
        detail: `"${purchase.purchaseNumber}" already has this item; change its quantity there instead.`,
        errors: [{ field: 'inventoryItemId', message: 'Already on this purchase' }],
      });
    }
    const item = await this.repository.create({
      purchaseId: purchase.id,
      inventoryItemId: fields.inventoryItemId,
      primaryQty: fields.primaryQty,
      neededBy: fields.neededBy ?? null,
      notes: fields.notes ?? null,
    });
    this.logger.log(`Added item ${fields.inventoryItemId} to purchase ${purchase.purchaseNumber}`);
    return item;
  }

  // Changes a purchase item's quantity, never below what is already allocated, needed-by date or note; null clears the
  // date or note; the quantity's field message names the allocated amount as {{qty:<primary>}} for the quantity field
  // to show in the unit being entered
  async update(purchase: ItemsPurchase, item: PurchaseItemRow, dto: UpdatePurchaseItemDto): Promise<void> {
    this.isPurchaseOpen(purchase);
    if (dto.primaryQty !== undefined && new Decimal(dto.primaryQty).lt(item.allocatedPrimaryQty)) {
      throw new ConflictException({
        label: 'Below Allocated',
        detail: `${item.allocatedPrimaryQty} ${item.primaryUomSymbol} of ${item.inventoryItemName} are already allocated; the quantity cannot go below that.`,
        errors: [{ field: 'primaryQty', message: `At least {{qty:${item.allocatedPrimaryQty}}}` }],
      });
    }
    await this.repository.update(item.id, {
      primaryQty: dto.primaryQty,
      neededBy: dto.neededBy,
      notes: dto.notes,
    });
    this.logger.log(`Updated item ${item.id} on purchase ${purchase.purchaseNumber}`);
  }

  // Returns one page of a purchase's items with how far each has got, filtered by the bucket the table is on
  findForTable(
    purchase: QuotedPurchase,
    scope: QuotingScope,
    state: TableState,
  ): Promise<{ result: PurchaseItemTableRow[]; count: number }> {
    const quoting = { required: purchase.quotationsRequired, minimum: purchase.minQuotations, ...scope };
    const fieldMap: FieldMap = {
      bucket: {
        expression: (value) => purchaseItemBucketCondition(String(value) as PurchaseItemBucket, quoting),
        type: 'string',
      },
      categoryId: { column: inventoryItems.categoryId, type: 'string' },
      supplierId: { expression: (value) => purchaseItemProgress.isAllocatedTo(String(value)), type: 'string' },
      inventoryItemName: { column: inventoryItems.name, type: 'string' },
      primaryQty: { column: purchaseItems.primaryQty, type: 'number' },
      neededBy: { column: purchaseItems.neededBy, type: 'string' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    return this.repository.findForTable(purchase.id, scope, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, PurchaseItemsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(inventoryItems.name)],
      limit,
      offset,
    });
  }

  // Returns one page of the document lines that move a purchase item, narrowed by kind, status or supplier and ordered by
  // the table's state, oldest first unless it sorts them
  findDocumentsForTable(
    itemId: string,
    state: TableState,
  ): Promise<{ result: PurchaseItemDocumentRow[]; count: number }> {
    const fieldMap: FieldMap = {
      type: { column: purchaseItemDocuments.type, type: 'string' },
      status: { column: purchaseItemDocuments.status, type: 'string' },
      supplierId: { column: purchaseItemDocuments.supplierId, type: 'string' },
      date: { column: purchaseItemDocuments.date, type: 'string' },
      documentNumber: { column: purchaseItemDocuments.documentNumber, type: 'string' },
    };
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { limit = 50, offset = 0 } = state.pagination;
    return this.repository.findDocumentsForTable(itemId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, { documentNumber: fieldMap.documentNumber }),
      ),
      orderBy:
        orderBy.length > 0 ? orderBy : [asc(purchaseItemDocuments.date), asc(purchaseItemDocuments.documentNumber)],
      limit,
      offset,
    });
  }

  // Counts a purchase's items in each bucket of the items table
  findFacets(purchase: QuotedPurchase, scope: QuotingScope): Promise<PurchaseItemFacets> {
    const quoting = { required: purchase.quotationsRequired, minimum: purchase.minQuotations, ...scope };
    const conditions = Object.fromEntries(
      Object.values(PurchaseItemBucketValues).map((bucket) => [bucket, purchaseItemBucketCondition(bucket, quoting)]),
    ) as Record<PurchaseItemBucket, SQL>;
    return this.repository.countMatching(purchase.id, conditions);
  }

  // Returns one purchase item of a purchase
  async findById(purchaseId: string, itemId: string): Promise<PurchaseItemDto> {
    return PurchaseItemDto.from(await this.repository.findOnPurchaseOrThrow(purchaseId, itemId));
  }

  // Returns the items of a purchase with item names, primary units and allocated quantities
  findByPurchaseId(purchaseId: string): Promise<PurchaseItemRow[]> {
    return this.repository.findByPurchaseId(purchaseId);
  }

  // Lowers the requested quantity of the given items by what a cancelled supplier had of them, removing an item left with
  // nothing, in the caller's transaction
  async lowerBy(purchaseId: string, drops: { itemId: string; primaryQty: number }[]): Promise<void> {
    const items = await this.repository.findDetailsOnPurchase(
      purchaseId,
      drops.map((drop) => drop.itemId),
    );
    const dropByItem = new Map(drops.map((drop) => [drop.itemId, drop.primaryQty]));
    const left = items.map((item) => ({
      id: item.id,
      primaryQty: new Decimal(item.primaryQty).minus(dropByItem.get(item.id) ?? 0).toDecimalPlaces(3),
    }));
    await this.repository.deleteByIds(left.filter((item) => item.primaryQty.lte(0)).map((item) => item.id));
    await this.repository.updateQuantities(
      left
        .filter((item) => item.primaryQty.gt(0))
        .map((item) => ({ id: item.id, primaryQty: item.primaryQty.toNumber() })),
    );
  }

  // Lowers every item of a closing purchase to what is allocated of it, removing items with nothing allocated, in the
  // caller's transaction
  async lowerToAllocated(purchaseId: string): Promise<void> {
    const short = (await this.repository.findByPurchaseId(purchaseId)).filter((item) =>
      new Decimal(item.allocatedPrimaryQty).lt(item.primaryQty),
    );
    await this.repository.deleteByIds(
      short.filter((item) => new Decimal(item.allocatedPrimaryQty).lte(0)).map((item) => item.id),
    );
    await this.repository.updateQuantities(
      short
        .filter((item) => new Decimal(item.allocatedPrimaryQty).gt(0))
        .map((item) => ({ id: item.id, primaryQty: new Decimal(item.allocatedPrimaryQty).toNumber() })),
    );
  }

  // Whether some item of a purchase still has quantity no supplier is allocated
  hasUnallocated(purchaseId: string): Promise<boolean> {
    return this.repository.hasUnallocated(purchaseId);
  }

  // Returns the inventory items of a purchase still to allocate
  findUnallocatedItemIds(purchaseId: string): Promise<string[]> {
    return this.repository.findUnallocatedItemIds(purchaseId);
  }

  // Removes an item from a purchase's items while nothing of it is allocated
  async remove(purchase: ItemsPurchase, item: PurchaseItemRow): Promise<void> {
    this.isPurchaseOpen(purchase);
    if (new Decimal(item.allocatedPrimaryQty).gt(0)) {
      throw new ConflictException({
        label: 'Item Allocated',
        detail: `${item.inventoryItemName} is allocated to a supplier; lower its quantity or cancel that supplier instead.`,
      });
    }
    await this.repository.delete(item.id);
    this.logger.log(`Removed item ${item.id} from purchase ${purchase.purchaseNumber}`);
  }

  // Rejects an items change unless the purchase is open (409)
  private isPurchaseOpen(purchase: ItemsPurchase): void {
    if (purchase.status === PurchaseStatusValues.OPEN) return;
    throw new ConflictException({
      label: 'Items Locked',
      detail: `"${purchase.purchaseNumber}" is ${purchase.status.toLowerCase()}, so its items can no longer change.`,
    });
  }
}
