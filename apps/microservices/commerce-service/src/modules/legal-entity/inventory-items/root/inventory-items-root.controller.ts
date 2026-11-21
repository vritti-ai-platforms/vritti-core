import type { InventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/entity/inventory-item-mrp.dto';
import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { LegalEntityInventoryItemCountsDto } from '@domain/inventory-items/dto/entity/legal-entity-inventory-item-counts.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LeInventoryItemsController {
  private readonly logger = new Logger(LeInventoryItemsController.name);

  constructor(
    private readonly service: InventoryItemsDomainService,
    private readonly mrpsService: InventoryItemMrpsDomainService,
  ) {}

  // One master item, read-only from a legal entity
  @MessagePattern({ cmd: 'le.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // The organization's master items, read-only from a legal entity, narrowed to a site's when the table picks one
  @MessagePattern({ cmd: 'le.inventoryItems.table' })
  async table(@Payload() state: TableState): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForLegalEntityTable(state);
  }

  // The item's MRPs for the data table, read-only from a legal entity
  @MessagePattern({ cmd: 'le.inventoryItems.mrp.table' })
  async mrpTable(
    @Payload() data: { inventoryItemId: string } & TableState,
  ): Promise<{ result: InventoryItemMrpDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.mrp.table — inventoryItemId: ${inventoryItemId}`);
    return this.mrpsService.findForTable(inventoryItemId, state);
  }

  // Counts the item's suppliers and MRPs, one per tab of a legal entity's detail page
  @MessagePattern({ cmd: 'le.inventoryItems.findCounts' })
  async findCounts(@Payload() data: { id: string }): Promise<LegalEntityInventoryItemCountsDto> {
    this.logger.log(`inventoryItems.findCounts — id: ${data.id}`);
    return this.service.findLegalEntityCounts(data.id);
  }
}
