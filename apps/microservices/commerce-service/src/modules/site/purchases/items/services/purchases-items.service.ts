import { InventoryItemSiteStockLevelsDomainService } from '@domain/inventory-item-site-stock-levels/services/inventory-item-site-stock-levels.service';
import { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import type { CreatePurchaseItemDto } from '@domain/purchase-items/dto/request/create-purchase-item.dto';
import type { UpdatePurchaseItemDto } from '@domain/purchase-items/dto/request/update-purchase-item.dto';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class PurchasesItemsService {
  private readonly logger = new Logger(PurchasesItemsService.name);

  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly siteStockLevelsService: InventoryItemSiteStockLevelsDomainService,
  ) {}

  // Adds an item enabled at the purchase's site to its items, or adds the quantity to the line already requesting it
  async create(dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemDto>> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    await this.siteStockLevelsService.ensureStockLevels([dto.inventoryItemId], 'inventoryItemId', purchase.siteId);
    const addition = await this.itemsService.add(purchase, dto);
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
  async update(dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, dto.itemId);
    await this.itemsService.update(purchase, item, dto);
    return { success: true, message: `"${item.inventoryItemName}" updated on "${purchase.purchaseNumber}".` };
  }

  // Returns the items of a purchase in reach with their names, primary units and allocated quantities
  async findByPurchase(id: string): Promise<PurchaseItemDto[]> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const items = await this.itemsService.findByPurchaseId(purchase.id);
    return items.map(PurchaseItemDto.from);
  }

  // Removes an item from a purchase's items
  async delete(id: string, itemId: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, itemId);
    await this.itemsService.remove(purchase, item);
    return { success: true, message: `"${item.inventoryItemName}" removed from "${purchase.purchaseNumber}".` };
  }
}
