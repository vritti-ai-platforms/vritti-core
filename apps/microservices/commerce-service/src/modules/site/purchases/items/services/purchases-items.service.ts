import { InventoryItemSiteStockLevelsDomainService } from '@domain/inventory-item-site-stock-levels/services/inventory-item-site-stock-levels.service';
import { PurchaseEventActionValues } from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseEventsDomainService } from '@domain/purchase-events/services/purchase-events.service';
import { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import type { CreatePurchaseItemDto } from '@domain/purchase-items/dto/request/create-purchase-item.dto';
import type { UpdatePurchaseItemDto } from '@domain/purchase-items/dto/request/update-purchase-item.dto';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class PurchasesItemsService {
  private readonly logger = new Logger(PurchasesItemsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly eventsService: PurchaseEventsDomainService,
    private readonly siteStockLevelsService: InventoryItemSiteStockLevelsDomainService,
  ) {}

  // Adds an item enabled at the purchase's site to its items, or adds the quantity to the line already requesting it
  async create(dto: CreatePurchaseItemDto, headers: NatsHeaders): Promise<CreateResponseDto<PurchaseItemDto>> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    await this.siteStockLevelsService.ensureStockLevels(purchase.siteId, [dto.inventoryItemId], 'inventoryItemId');
    const addition = await this.database.runInTransaction(async () => {
      const added = await this.itemsService.add(purchase, dto, headers.userId || null);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.ADD_ITEM,
        actorId: headers.userId || null,
      });
      return added;
    });
    this.logger.log(`purchases.items.create — ${purchase.purchaseNumber}, item: ${dto.inventoryItemId}`);
    return {
      success: true,
      message: addition.isMerged
        ? `Quantity added to the item already on "${purchase.purchaseNumber}".`
        : `Item added to "${purchase.purchaseNumber}".`,
      data: await this.itemsService.findById(purchase.id, addition.item.id),
    };
  }

  // Changes a purchase item's quantity, needed-by date or note
  async update(dto: UpdatePurchaseItemDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, dto.itemId);
    await this.database.runInTransaction(async () => {
      await this.itemsService.update(purchase, item, dto);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.UPDATE_ITEM,
        actorId: headers.userId || null,
      });
    });
    return { success: true, message: `"${item.inventoryItemName}" updated on "${purchase.purchaseNumber}".` };
  }

  // Returns the items of a purchase in reach with their names, primary units and allocated quantities
  async findByPurchase(id: string): Promise<PurchaseItemDto[]> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const items = await this.itemsService.findByPurchaseId(purchase.id);
    return items.map(PurchaseItemDto.from);
  }

  // Removes an item from a purchase's items
  async delete(id: string, itemId: string, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, itemId);
    await this.database.runInTransaction(async () => {
      await this.itemsService.remove(purchase, item);
      await this.eventsService.record({
        purchaseId: purchase.id,
        action: PurchaseEventActionValues.REMOVE_ITEM,
        actorId: headers.userId || null,
      });
    });
    return { success: true, message: `"${item.inventoryItemName}" removed from "${purchase.purchaseNumber}".` };
  }
}
