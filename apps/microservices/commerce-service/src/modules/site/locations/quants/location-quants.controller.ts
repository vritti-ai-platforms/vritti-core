import type { LocationItemDto } from '@domain/inventory-item-quants/dto/entity/location-item.dto';
import type { LocationItemQuantDto } from '@domain/inventory-item-quants/dto/entity/location-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class LocationQuantsController {
  private readonly logger = new Logger(LocationQuantsController.name);

  constructor(private readonly service: InventoryItemQuantsService) {}

  @MessagePattern({ cmd: 'site.locations.itemsTable' })
  async itemsTable(
    @Payload() data: { locationId: string } & TableViewState,
  ): Promise<{ result: LocationItemDto[]; count: number }> {
    this.logger.log(`locations.itemsTable — locationId: ${data.locationId}`);
    const { locationId, ...state } = data;
    return this.service.findItemsForLocationTable(locationId, state);
  }

  @MessagePattern({ cmd: 'site.locations.itemQuants' })
  async itemQuants(@Payload() data: { locationId: string; itemId: string }): Promise<LocationItemQuantDto[]> {
    this.logger.log(`locations.itemQuants — locationId: ${data.locationId}, itemId: ${data.itemId}`);
    return this.service.findItemBreakdownForLocation(data.locationId, data.itemId);
  }
}
