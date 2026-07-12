import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { LocationRoleValues, locations, posTerminals } from '@/db/schema';
import type { CreatePosTerminalDto } from '@/modules/site/pos-terminals/dto/request/create-pos-terminal.dto';
import type { UpdatePosTerminalDto } from '@/modules/site/pos-terminals/dto/request/update-pos-terminal.dto';
import { PosTerminalDto } from '../dto/entity/pos-terminal.dto';
import { PosTerminalsRepository } from '../repositories/pos-terminals.repository';

// Location context pre-fetched by the app-layer before write operations
export type LocationContext = {
  id: string;
  locationRole: string;
  isActive: boolean;
};

@Injectable()
export class PosTerminalsService {
  private readonly logger = new Logger(PosTerminalsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: posTerminals.name, type: 'string' },
    code: { column: posTerminals.code, type: 'string' },
    locationName: { column: locations.name, type: 'string' },
    isActive: { column: posTerminals.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: PosTerminalsRepository) {}

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

  // Creates a new POS terminal. App-layer must pre-validate the location and pass it as context.
  async create(data: CreatePosTerminalDto, location: LocationContext): Promise<CreateResponseDto<PosTerminalDto>> {
    this.assertValidLocation(location);

    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      locationId: data.locationId,
      catalogId: data.catalogId ?? null,
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

  // Updates an existing POS terminal. App-layer must pre-validate the location if provided.
  async update(id: string, data: UpdatePosTerminalDto, location?: LocationContext): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('POS terminal not found.');

    if (location) {
      this.assertValidLocation(location);
    }

    const updated = await this.repository.update(id, {
      ...data,
      description: data.description !== undefined ? data.description || null : undefined,
    });

    this.logger.log(`Updated POS terminal: ${updated.name} (${id})`);
    return { success: true, message: `POS terminal "${updated.name}" updated successfully.` };
  }

  // Deletes a POS terminal
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('POS terminal not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted POS terminal: ${existing.name} (${id})`);
    return { success: true, message: `POS terminal "${existing.name}" deleted successfully.` };
  }

  // Validates that the storage location has POS role and is active
  private assertValidLocation(location: LocationContext): void {
    if (location.locationRole !== LocationRoleValues.RESERVED_STORAGE) {
      throw new BadRequestException('POS terminal must be linked to a reserved storage location.');
    }

    if (!location.isActive) {
      throw new BadRequestException('POS terminal must be linked to an active storage location.');
    }
  }
}
