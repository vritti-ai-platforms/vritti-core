import type { InventoryItemLocationDto } from '@domain/inventory-item-locations/dto/entity/inventory-item-location.dto';
import { AddInventoryItemLocationDto } from '@domain/inventory-item-locations/dto/request/add-inventory-item-location.dto';
import { UpdateInventoryItemLocationDto } from '@domain/inventory-item-locations/dto/request/update-inventory-item-location.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { InventoryItemsLocationsService } from './services/inventory-items-locations.service';

@Controller()
export class InventoryItemsLocationsController {
  private readonly logger = new Logger(InventoryItemsLocationsController.name);

  constructor(private readonly service: InventoryItemsLocationsService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.locationsTable' })
  async locationsTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    this.logger.log(`inventoryItems.locationsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForTable(data.inventoryItemId, data);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.locationsFeed' })
  async locationsFeed(@Payload() data: { inventoryItemId: string; limit: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemLocationDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.locationsFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findLocationsFeed(data.inventoryItemId, data.limit, data.cursor);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.addLocation' })
  async createLocation(
    @Payload() dto: AddInventoryItemLocationDto,
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    const { inventoryItemId, ...rest } = dto;
    this.logger.log(`inventoryItems.addLocation — inventoryItemId: ${inventoryItemId}`);
    return this.service.create(inventoryItemId, rest);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.updateLocation' })
  async updateLocation(@Payload() dto: UpdateInventoryItemLocationDto): Promise<SuccessResponseDto> {
    const { id, reorderLevel } = dto;
    this.logger.log(`inventoryItems.updateLocation — id: ${id}`);
    return this.service.update(id, { reorderLevel });
  }

  @MessagePattern({ cmd: 'site.inventoryItems.removeLocation' })
  async deleteLocation(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeLocation — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
