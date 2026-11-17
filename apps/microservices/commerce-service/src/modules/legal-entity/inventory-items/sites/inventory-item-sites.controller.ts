import { InventoryItemSiteDto } from '@domain/inventory-item-sites/dto/entity/inventory-item-site.dto';
import type { ItemStockBySiteDto } from '@domain/inventory-item-sites/dto/entity/item-site-stock.dto';
import { BlockSiteItemDto } from '@domain/inventory-item-sites/dto/request/block-site-item.dto';
import { ReplenishmentDto } from '@domain/inventory-item-sites/dto/request/replenishment.dto';
import { SetSupplierItemsRequiredDto } from '@domain/inventory-item-sites/dto/request/set-supplier-items-required.dto';
import { SiteItemRefDto } from '@domain/inventory-item-sites/dto/request/site-item-ref.dto';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableFilters } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeInventoryItemSitesController {
  private readonly logger = new Logger(LeInventoryItemSitesController.name);

  constructor(private readonly service: InventoryItemSitesDomainService) {}

  // Adds the item to one of the legal entity's sites with how it is replenished there
  @MessagePattern({ cmd: 'le.inventoryItems.sites.create' })
  async create(@Payload() dto: ReplenishmentDto): Promise<CreateResponseDto<InventoryItemSiteDto>> {
    this.logger.log(`le.inventoryItems.sites.create — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`);
    const entity = await this.service.create(dto);
    return { success: true, message: 'Item added to the site.', data: InventoryItemSiteDto.from(entity) };
  }

  // Changes how one of the legal entity's sites replenishes the item
  @MessagePattern({ cmd: 'le.inventoryItems.sites.update' })
  update(@Payload() dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.update — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`);
    return this.service.update(dto);
  }

  // Stops one of the legal entity's sites buying the item, with why
  @MessagePattern({ cmd: 'le.inventoryItems.sites.block' })
  block(@Payload() dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.block — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`);
    return this.service.block(dto);
  }

  // Lets one of the legal entity's sites buy the item again
  @MessagePattern({ cmd: 'le.inventoryItems.sites.unblock' })
  unblock(@Payload() dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.unblock — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`);
    return this.service.unblock(dto);
  }

  // Ties buying the item at one of the legal entity's sites to the supplier's item set up there, or frees it
  @MessagePattern({ cmd: 'le.inventoryItems.sites.setSupplierItemsRequired' })
  setSupplierItemsRequired(@Payload() dto: SetSupplierItemsRequiredDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.sites.setSupplierItemsRequired — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`,
    );
    return this.service.setSupplierItemsRequired(dto);
  }

  // The legal entity's sites that carry the item, with the stock each holds by location and whether each passes the
  // table's status filter; core pages the sites and attaches these rows
  @MessagePattern({ cmd: 'le.inventoryItems.sites.bySite' })
  bySite(
    @Payload() data: { inventoryItemId: string; filters: TableFilters },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<ItemStockBySiteDto> {
    this.logger.log(`le.inventoryItems.sites.bySite — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findStockBySite(data.inventoryItemId, data.filters, leCurrencyCode as CurrencyCode);
  }

  // The legal entity's sites that already carry the item
  @MessagePattern({ cmd: 'le.inventoryItems.sites.siteIds' })
  siteIds(@Payload() data: { inventoryItemId: string }): Promise<string[]> {
    this.logger.log(`le.inventoryItems.sites.siteIds — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findSiteIdsForItem(data.inventoryItemId);
  }

  // Removes the item from one of the legal entity's sites
  @MessagePattern({ cmd: 'le.inventoryItems.sites.delete' })
  delete(@Payload() dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.inventoryItems.sites.delete — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`);
    return this.service.delete(dto);
  }
}
