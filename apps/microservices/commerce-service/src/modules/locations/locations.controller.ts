import type { LocationDto } from '@domain/locations/dto/entity/location.dto';
import type { LocationCountDto } from '@domain/locations/dto/entity/location-count.dto';
import type { LocationTreeDto } from '@domain/locations/dto/entity/location-tree.dto';
import { LocationsService } from '@domain/locations/services/locations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import type { CreateLocationDto } from './dto/request/create-location.dto';
import type { ReorderLocationsDto } from './dto/request/reorder-locations.dto';
import type { UpdateLocationDto } from './dto/request/update-location.dto';

@Controller()
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationsService: LocationsService) {}

  // Returns total storage location count
  @MessagePattern({ cmd: 'locations.count' })
  async count(): Promise<LocationCountDto> {
    this.logger.log('locations.count');
    return this.locationsService.count();
  }

  // Returns storage locations as a tree hierarchy for TreeView
  @MessagePattern({ cmd: 'locations.tree' })
  async tree(@Payload() data?: { search?: string }): Promise<LocationTreeDto[]> {
    this.logger.log('locations.tree');
    return this.locationsService.findTree(data?.search);
  }

  // Returns paginated child locations for a given parent ID
  @MessagePattern({ cmd: 'locations.childrenTable' })
  async childrenTable(
    @Payload() data: { parentId: string } & TableViewState,
  ): Promise<{ result: LocationDto[]; count: number }> {
    this.logger.log(`locations.childrenTable — parentId: ${data.parentId}`);
    return this.locationsService.findChildrenForTable(data.parentId, data);
  }

  // Returns a single storage location by ID
  @MessagePattern({ cmd: 'locations.findById' })
  async findById(@Payload() data: { id: string }): Promise<LocationDto> {
    this.logger.log(`locations.findById — id: ${data.id}`);
    return this.locationsService.findById(data.id);
  }

  // Returns paginated location options for select dropdowns
  @MessagePattern({ cmd: 'locations.select' })
  async select(
    @Payload() data: SelectOptionsQueryDto & { locationRoles?: string; inventoryItemId?: string },
  ): Promise<SelectQueryResult> {
    this.logger.log(
      `locations.select${data.locationRoles ? ` — locationRoles: ${data.locationRoles}` : ''}${
        data.inventoryItemId ? ` — inventoryItemId: ${data.inventoryItemId}` : ''
      }${data.groupIdKey ? ` — groupIdKey: ${data.groupIdKey}` : ''}`,
    );
    return this.locationsService.findForSelect(data);
  }

  // Reorders siblings under a parent location
  @MessagePattern({ cmd: 'locations.reorder' })
  async reorder(@Payload() data: ReorderLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('locations.reorder');
    return this.locationsService.reorderSiblings(data.parentId ?? null, data.orderedIds);
  }

  // Creates a new storage location
  @MessagePattern({ cmd: 'locations.create' })
  async create(@Payload() dto: CreateLocationDto): Promise<CreateResponseDto<LocationDto>> {
    this.logger.log(`locations.create — name: ${dto.name}, code: ${dto.code}`);
    return this.locationsService.create(dto);
  }

  // Updates an storage location by ID
  @MessagePattern({ cmd: 'locations.update' })
  async update(@Payload() data: { id: string } & UpdateLocationDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`locations.update — id: ${id}`);
    return this.locationsService.update(id, updateData);
  }

  // Deletes an storage location by ID
  @MessagePattern({ cmd: 'locations.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`locations.delete — id: ${data.id}`);
    return this.locationsService.delete(data.id);
  }
}
