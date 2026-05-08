import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, NatsClientService, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { SelectOptionsQueryDto } from '@vritti/api-sdk';
import type { CreateLocationDto } from '../dto/request/create-location.dto';
import type { ReorderLocationsDto } from '../dto/request/reorder-locations.dto';
import type { UpdateLocationDto } from '../dto/request/update-location.dto';
import type { LocationChildrenTableResponseDto } from '../dto/response/location-children-table-response.dto';
import type { LocationCountResponseDto } from '../dto/response/location-count-response.dto';
import type { LocationResponseDto } from '../dto/response/location-response.dto';
import type { LocationTreeResponseDto } from '../dto/response/location-tree-response.dto';

@Injectable()
export class LocationsGatewayService {
  private readonly logger = new Logger(LocationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns total storage location count
  async count(): Promise<LocationCountResponseDto> {
    this.logger.log('locations.count');
    return this.nats.send('commerce', 'locations.count', {});
  }

  // Returns storage locations as a tree hierarchy
  async findTree(search?: string): Promise<LocationTreeResponseDto[]> {
    this.logger.log('locations.tree');
    return this.nats.send('commerce', 'locations.tree', { search });
  }

  // Returns paginated child locations for a given parent ID
  async findChildrenForTable(userId: string, parentId: string): Promise<LocationChildrenTableResponseDto> {
    this.logger.log(`locations.childrenTable — parentId: ${parentId}`);
    const slug = `locations-children-${parentId}`;
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, slug);
    const { result, count } = await this.nats.send<{ result: LocationResponseDto[]; count: number }>(
      'commerce',
      'locations.childrenTable',
      { parentId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns a single storage location by ID
  async findById(id: string): Promise<LocationResponseDto> {
    this.logger.log(`locations.findById — id: ${id}`);
    return this.nats.send('commerce', 'locations.findById', { id });
  }

  // Returns paginated location options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('locations.select');
    return this.nats.send('commerce', 'locations.select', params);
  }

  // Reorders sibling locations under a parent
  async reorder(dto: ReorderLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('locations.reorder');
    return this.nats.send('commerce', 'locations.reorder', dto);
  }

  // Creates a new storage location
  async create(dto: CreateLocationDto): Promise<CreateResponseDto<LocationResponseDto>> {
    this.logger.log(`locations.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'locations.create', dto);
  }

  // Updates an storage location by ID
  async update(id: string, dto: UpdateLocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`locations.update — id: ${id}`);
    return this.nats.send('commerce', 'locations.update', { id, ...dto });
  }

  // Deletes an storage location by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`locations.delete — id: ${id}`);
    return this.nats.send('commerce', 'locations.delete', { id });
  }
}
