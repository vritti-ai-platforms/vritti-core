import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type Purchase, type PurchaseItem, PurchaseStatusValues, PurchaseStepValues } from '@/db/schema';
import { PurchaseItemDto } from '../dto/entity/purchase-item.dto';
import type { PurchaseItemFieldsDto } from '../dto/request/purchase-item-fields.dto';
import type { UpdatePurchaseItemDto } from '../dto/request/update-purchase-item.dto';
import { type PurchaseItemRow, PurchaseItemsDomainRepository } from '../repositories/purchase-items.repository';

export type ItemsPurchase = Pick<Purchase, 'id' | 'purchaseNumber' | 'status' | 'step'>;

export interface PurchaseItemAddition {
  item: PurchaseItem;
  isMerged: boolean;
}

@Injectable()
export class PurchaseItemsDomainService {
  private readonly logger = new Logger(PurchaseItemsDomainService.name);

  constructor(private readonly repository: PurchaseItemsDomainRepository) {}

  // Returns the items of a purchase with item names, primary units and allocated quantities
  findByPurchaseId(purchaseId: string): Promise<PurchaseItemRow[]> {
    return this.repository.findByPurchaseId(purchaseId);
  }

  // Returns one purchase item of a purchase
  async findById(purchaseId: string, itemId: string): Promise<PurchaseItemDto> {
    return PurchaseItemDto.from(await this.findOnPurchaseOrThrow(purchaseId, itemId));
  }

  // Loads a purchase item of the given purchase, throwing when it is not on it
  async findOnPurchaseOrThrow(purchaseId: string, itemId: string): Promise<PurchaseItemRow> {
    const item = await this.repository.findDetailOnPurchase(purchaseId, itemId);
    if (!item) throw new NotFoundException('Purchase item not found.');
    return item;
  }

  // Adds an item to a purchase's items, or adds the quantity to the line that already requests it; a new line is needed
  // by the purchase's date unless it names its own
  async add(
    purchase: ItemsPurchase,
    fields: PurchaseItemFieldsDto,
    createdBy: string | null,
  ): Promise<PurchaseItemAddition> {
    this.assertItemsEditable(purchase);
    const existing = await this.repository.findForInventoryItem(purchase.id, fields.inventoryItemId);
    if (existing) {
      const item = await this.repository.update(existing.id, {
        primaryQty: new Decimal(existing.primaryQty).plus(fields.primaryQty).toDecimalPlaces(3).toNumber(),
        neededBy: fields.neededBy ?? existing.neededBy,
        notes: fields.notes ?? existing.notes,
      });
      this.logger.log(
        `Added ${fields.primaryQty} to item ${fields.inventoryItemId} on purchase ${purchase.purchaseNumber}`,
      );
      return { item, isMerged: true };
    }
    const item = await this.repository.create({
      purchaseId: purchase.id,
      inventoryItemId: fields.inventoryItemId,
      primaryQty: fields.primaryQty,
      neededBy: fields.neededBy ?? null,
      notes: fields.notes ?? null,
      createdBy,
    });
    this.logger.log(`Added item ${fields.inventoryItemId} to purchase ${purchase.purchaseNumber}`);
    return { item, isMerged: false };
  }

  // Changes a purchase item's quantity, needed-by date or note; null clears the date or note
  async update(purchase: ItemsPurchase, item: PurchaseItem, dto: UpdatePurchaseItemDto): Promise<void> {
    this.assertItemsEditable(purchase);
    await this.repository.update(item.id, {
      primaryQty: dto.primaryQty,
      neededBy: dto.neededBy,
      notes: dto.notes,
    });
    this.logger.log(`Updated item ${item.id} on purchase ${purchase.purchaseNumber}`);
  }

  // Removes an item from a purchase's items
  async remove(purchase: ItemsPurchase, item: PurchaseItem): Promise<void> {
    this.assertItemsEditable(purchase);
    await this.repository.delete(item.id);
    this.logger.log(`Removed item ${item.id} from purchase ${purchase.purchaseNumber}`);
  }

  // Rejects an items change unless the purchase is open in REQUESTING (409)
  private assertItemsEditable(purchase: ItemsPurchase): void {
    if (purchase.status === PurchaseStatusValues.OPEN && purchase.step === PurchaseStepValues.REQUESTING) return;
    throw new ConflictException({
      label: 'Items Locked',
      detail: `"${purchase.purchaseNumber}" is past Requesting, so its items can no longer change.`,
    });
  }
}
