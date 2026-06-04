import type { InventoryItemLocationDto } from '@domain/inventory-item-locations/dto/entity/inventory-item-location.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import { InventoryItemsLocationsService } from './services/inventory-items-locations.service';

@Controller()
export class InventoryItemsLocationsController {
  private readonly logger = new Logger(InventoryItemsLocationsController.name);

  constructor(private readonly service: InventoryItemsLocationsService) {}

  @MessagePattern({ cmd: 'inventoryItems.locationsTable' })
  async locationsTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    this.logger.log(`inventoryItems.locationsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForTable(data.inventoryItemId, data);
  }

  @MessagePattern({ cmd: 'inventoryItems.addLocation' })
  async createLocation(
    @Payload() data: { inventoryItemId: string; locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    this.logger.log(`inventoryItems.addLocation — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.create(data.inventoryItemId, {
      locationId: data.locationId,
      reorderLevel: data.reorderLevel,
    });
  }

  @MessagePattern({ cmd: 'inventoryItems.updateLocation' })
  async updateLocation(@Payload() data: { id: string; reorderLevel: number }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.updateLocation — id: ${data.id}`);
    return this.service.update(data.id, { reorderLevel: data.reorderLevel });
  }

  @MessagePattern({ cmd: 'inventoryItems.removeLocation' })
  async deleteLocation(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeLocation — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
