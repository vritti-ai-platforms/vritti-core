import type { InventoryItemLocationDto } from '@domain/inventory-item-locations/dto/entity/inventory-item-location.dto';
import { InventoryItemLocationsService } from '@domain/inventory-item-locations/services/inventory-item-locations.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

// Top-level service for inventory-item locations endpoints. All reads/writes
// go through here so we can assert parent-item existence before delegating
// to the locations domain service.
@Injectable()
export class InventoryItemsLocationsService {
  private readonly logger = new Logger(InventoryItemsLocationsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly itemLocationsService: InventoryItemLocationsService,
  ) {}

  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.itemLocationsService.findForTable(inventoryItemId, state);
  }

  async create(
    inventoryItemId: string,
    data: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    this.logger.log(`create — inventoryItemId=${inventoryItemId}, locationId=${data.locationId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.itemLocationsService.create(inventoryItemId, data);
  }

  async update(id: string, data: { reorderLevel: number }): Promise<SuccessResponseDto> {
    this.logger.log(`update — id=${id}`);
    return this.itemLocationsService.update(id, data);
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`delete — id=${id}`);
    return this.itemLocationsService.delete(id);
  }
}
