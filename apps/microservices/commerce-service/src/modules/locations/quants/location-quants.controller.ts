import type { LocationItemDto } from '@domain/locations/quants/dto/entity/location-item.dto';
import type { LocationItemQuantDto } from '@domain/locations/quants/dto/entity/location-item-quant.dto';
import { LocationQuantsService } from '@domain/locations/quants/location-quants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';

@Controller()
export class LocationQuantsController {
  private readonly logger = new Logger(LocationQuantsController.name);

  constructor(private readonly service: LocationQuantsService) {}

  @MessagePattern({ cmd: 'locations.itemsTable' })
  async itemsTable(
    @Payload() data: { locationId: string } & TableViewState,
  ): Promise<{ result: LocationItemDto[]; count: number }> {
    this.logger.log(`locations.itemsTable — locationId: ${data.locationId}`);
    return this.service.findItemsForTable(data.locationId, data);
  }

  @MessagePattern({ cmd: 'locations.itemQuants' })
  async itemQuants(@Payload() data: { locationId: string; itemId: string }): Promise<LocationItemQuantDto[]> {
    this.logger.log(`locations.itemQuants — locationId: ${data.locationId}, itemId: ${data.itemId}`);
    return this.service.findBreakdown(data.locationId, data.itemId);
  }
}
