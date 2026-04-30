import { StorageLocationsRepository } from '@domain/storage-locations/repositories/storage-locations.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { posTerminals, storageLocations, StorageLocationRoleValues } from '@/db/schema';
import type { CreatePosTerminalDto } from '@/modules/pos-terminals/dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalDto } from '@/modules/pos-terminals/dto/request/update-pos-terminal.dto';
import { PosTerminalDto } from '../dto/entity/pos-terminal.dto';
import { PosTerminalsRepository } from '../repositories/pos-terminals.repository';

@Injectable()
export class PosTerminalsService {
  private readonly logger = new Logger(PosTerminalsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: posTerminals.name, type: 'string' },
    code: { column: posTerminals.code, type: 'string' },
    storageLocationName: { column: storageLocations.name, type: 'string' },
    isActive: { column: posTerminals.isActive, type: 'boolean' },
  };

  constructor(
    private readonly repository: PosTerminalsRepository,
    private readonly storageLocationsRepository: StorageLocationsRepository,
  ) {}

  // Returns paginated, filtered, and sorted POS terminals for the data table
  async findForTable(state: TableViewState): Promise<{ result: PosTerminalDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PosTerminalsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PosTerminalsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PosTerminalsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(posTerminals.name)],
      limit,
      offset,
    });

    return {
      result: result.map((row) => PosTerminalDto.from(row)),
      count,
    };
  }

  // Returns a single POS terminal by ID
  async findById(id: string): Promise<PosTerminalDto> {
    const entity = await this.repository.findByIdWithLocationName(id);
    if (!entity) throw new NotFoundException('POS terminal not found.');
    return PosTerminalDto.from(entity);
  }

  // Returns paginated POS terminal options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns POS-role storage location options for select dropdowns
  findPosStorageLocationsForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.storageLocationsRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      where: {
        locationRole: StorageLocationRoleValues.POS,
      },
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a new POS terminal
  async create(data: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalDto>> {
    await this.assertValidStorageLocation(data.storageLocationId);

    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      storageLocationId: data.storageLocationId,
      description: data.description || null,
      isActive: data.isActive ?? true,
    });

    const created = await this.repository.findByIdWithLocationName(entity.id);
    if (!created) throw new NotFoundException('POS terminal not found.');

    this.logger.log(`Created POS terminal: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `POS terminal "${entity.name}" (${entity.code}) created successfully.`,
      data: PosTerminalDto.from(created),
    };
  }

  // Updates an existing POS terminal
  async update(id: string, data: UpdatePosTerminalDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('POS terminal not found.');

    if (data.storageLocationId) {
      await this.assertValidStorageLocation(data.storageLocationId);
    }

    await this.repository.update(id, {
      ...data,
      description: data.description !== undefined ? data.description || null : undefined,
    });

    this.logger.log(`Updated POS terminal: ${existing.name} (${id})`);
    return { success: true, message: `POS terminal "${existing.name}" updated successfully.` };
  }

  // Deletes a POS terminal
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('POS terminal not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted POS terminal: ${existing.name} (${id})`);
    return { success: true, message: `POS terminal "${existing.name}" deleted successfully.` };
  }

  // Validates that the storage location exists, is active, and has POS role
  private async assertValidStorageLocation(storageLocationId: string): Promise<void> {
    const location = await this.storageLocationsRepository.findById(storageLocationId);
    if (!location) throw new NotFoundException('Storage location not found.');

    if (location.locationRole !== StorageLocationRoleValues.POS) {
      throw new BadRequestException('POS terminal must be linked to a POS storage location.');
    }

    if (!location.isActive) {
      throw new BadRequestException('POS terminal must be linked to an active storage location.');
    }
  }
}
