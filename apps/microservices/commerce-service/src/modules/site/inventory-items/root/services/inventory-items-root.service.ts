import { InventoryItemSiteDto } from '@domain/inventory-item-sites/dto/entity/inventory-item-site.dto';
import type { BlockSiteItemDto } from '@domain/inventory-item-sites/dto/request/block-site-item.dto';
import type { ReplenishmentDto } from '@domain/inventory-item-sites/dto/request/replenishment.dto';
import type { SiteItemRefDto } from '@domain/inventory-item-sites/dto/request/site-item-ref.dto';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteInventoryItemsService {
  private readonly logger = new Logger(SiteInventoryItemsService.name);

  constructor(private readonly siteItemsService: InventoryItemSitesDomainService) {}

  // Adds an item to the current site with how it is replenished here
  async addToSite(dto: ReplenishmentDto): Promise<CreateResponseDto<InventoryItemSiteDto>> {
    this.logger.log(`addToSite — inventoryItemId=${dto.inventoryItemId}`);
    const entity = await this.siteItemsService.create({ ...dto, siteId: undefined });
    return { success: true, message: 'Item added to this site.', data: InventoryItemSiteDto.from(entity) };
  }

  // Changes how the current site replenishes an item
  updateReplenishment(dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`updateReplenishment — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.update({ ...dto, siteId: undefined });
  }

  // Stops the current site buying an item, with why
  block(dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`block — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.block({ ...dto, siteId: undefined });
  }

  // Lets the current site buy an item again
  unblock(inventoryItemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`unblock — inventoryItemId=${inventoryItemId}`);
    return this.siteItemsService.unblock({ inventoryItemId });
  }

  // How the current site carries an item, or null while it does not; RLS narrows the item's rows to this site
  async findSiteItem(inventoryItemId: string): Promise<InventoryItemSiteDto | null> {
    const [siteItem] = await this.siteItemsService.findByItem(inventoryItemId);
    return siteItem ? InventoryItemSiteDto.from(siteItem) : null;
  }

  // Removes an item from the current site, refused while it is held or on an open purchase here
  removeFromSite(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`removeFromSite — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.delete({ inventoryItemId: dto.inventoryItemId });
  }
}
