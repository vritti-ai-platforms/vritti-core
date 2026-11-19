import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type {
  LocationItemQuantWithDisplayDto,
  LocationItemWithDisplayDto,
} from './dto/entity/location-item-with-display.dto';
import { LocationQuantsService } from './services/location-quants.service';

@Controller()
export class LocationQuantsController {
  private readonly logger = new Logger(LocationQuantsController.name);

  constructor(private readonly service: LocationQuantsService) {}

  @MessagePattern({ cmd: 'site.locations.itemsTable' })
  async itemsTable(
    @Payload() data: { locationId: string } & TableState,
  ): Promise<{ result: LocationItemWithDisplayDto[]; count: number }> {
    this.logger.log(`locations.itemsTable — locationId: ${data.locationId}`);
    const { locationId, ...state } = data;
    return this.service.findItemsTable(locationId, state);
  }

  @MessagePattern({ cmd: 'site.locations.itemQuants' })
  async itemQuants(
    @Payload() data: { locationId: string; itemId: string },
  ): Promise<LocationItemQuantWithDisplayDto[]> {
    this.logger.log(`locations.itemQuants — locationId: ${data.locationId}, itemId: ${data.itemId}`);
    return this.service.findItemQuants(data.locationId, data.itemId);
  }
}
