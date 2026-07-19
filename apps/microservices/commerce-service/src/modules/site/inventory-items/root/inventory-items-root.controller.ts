import { EnableInventoryItemSiteDto } from '@domain/inventory-item-sites/dto/request/enable-inventory-item-site.dto';
import { UpdateReorderDto } from '@domain/inventory-item-sites/dto/request/update-reorder.dto';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import type { InventoryItemSite } from '@/db/schema';
import { SiteInventoryItemsService } from './services/inventory-items-root.service';

type SiteInventoryItemRow = InventoryItemDto & { reorderPoint: number; isStocked: boolean; stockedQuantity: string };

@Controller()
export class InventoryItemsRootController {
  private readonly logger = new Logger(InventoryItemsRootController.name);

  constructor(
    private readonly service: InventoryItemsDomainService,
    private readonly rootService: SiteInventoryItemsService,
  ) {}

  // Items enabled at the current site, with per-site reorder + stock levels
  @MessagePattern({ cmd: 'site.inventoryItems.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: SiteInventoryItemRow[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForSiteTable(state);
  }

  // Returns a single master inventory item by ID (shared detail)
  @MessagePattern({ cmd: 'site.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Enables a master item at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.enable' })
  async enable(
    @Payload() dto: EnableInventoryItemSiteDto,
    @RpcSiteId() siteId: string,
  ): Promise<CreateResponseDto<InventoryItemSite>> {
    this.logger.log(`inventoryItems.enable — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.enable(siteId, dto);
  }

  // Updates the reorder point for an item at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.reorder.update' })
  async updateReorder(@Payload() dto: UpdateReorderDto, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.reorder.update — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.updateReorder(siteId, dto.inventoryItemId, dto.reorderPoint);
  }
}
