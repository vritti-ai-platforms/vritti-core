import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SelectQueryResult,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { uom } from '@/db/schema';
import { UomDto } from '../dto/entity/uom.dto';
import type { CreateUomDto } from '@/modules/uom/dto/request/create-uom.dto';
import type { UpdateUomDto } from '@/modules/uom/dto/request/update-uom.dto';
import { UomRepository } from '../repositories/uom.repository';

@Injectable()
export class UomService {
  private readonly logger = new Logger(UomService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: uom.name, type: 'string' },
    symbol: { column: uom.symbol, type: 'string' },
  };

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns paginated, filtered, and sorted UOMs for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: UomDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, UomService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, UomService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, UomService.FIELD_MAP);

    const { result: rows, count } = await this.uomRepository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(uom.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    const dtos: UomDto[] = [];
    for (const entity of rows) {
      const baseSymbol = entity.baseUnitId ? await this.uomRepository.findSymbolById(entity.baseUnitId) : null;
      dtos.push(UomDto.from(entity, baseSymbol));
    }

    return { result: dtos, count };
  }

  // Returns paginated UOM options for select dropdowns
  findForSelect(params: {
    search?: string;
    limit?: number;
    offset?: number;
    values?: string;
    excludeIds?: string;
  }): Promise<SelectQueryResult> {
    return this.uomRepository.findForSelect({
      value: 'id',
      label: 'name',
      search: params.search,
      limit: params.limit,
      offset: params.offset,
      values: params.values,
      excludeIds: params.excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Creates a new UOM
  async create(data: CreateUomDto): Promise<UomDto> {
    const entity = await this.uomRepository.create({
      name: data.name,
      symbol: data.symbol,
      baseUnitId: data.baseUnitId ?? null,
      conversionFactor: String(data.conversionFactor ?? 1),
    });
    const baseSymbol = entity.baseUnitId ? await this.uomRepository.findSymbolById(entity.baseUnitId) : null;
    this.logger.log(`Created UOM: ${entity.name} (${entity.symbol})`);
    return UomDto.from(entity, baseSymbol);
  }

  // Finds a UOM by ID or throws NotFoundException
  async findById(id: string): Promise<UomDto> {
    const entity = await this.uomRepository.findById(id);
    if (!entity) throw new NotFoundException('Unit of measure not found.');
    const baseSymbol = entity.baseUnitId ? await this.uomRepository.findSymbolById(entity.baseUnitId) : null;
    return UomDto.from(entity, baseSymbol);
  }

  // Updates a UOM
  async update(id: string, data: UpdateUomDto): Promise<UomDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.symbol !== undefined) updatePayload.symbol = data.symbol;
    if (data.baseUnitId !== undefined) updatePayload.baseUnitId = data.baseUnitId;
    if (data.conversionFactor !== undefined) updatePayload.conversionFactor = String(data.conversionFactor);

    const entity = await this.uomRepository.update(id, updatePayload);
    const baseSymbol = entity.baseUnitId ? await this.uomRepository.findSymbolById(entity.baseUnitId) : null;
    this.logger.log(`Updated UOM: ${entity.name} (${entity.symbol})`);
    return UomDto.from(entity, baseSymbol);
  }

  // Deletes a UOM by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    await this.uomRepository.delete(id);
    this.logger.log(`Deleted UOM: ${id}`);
    return { success: true, message: 'Unit of measure deleted successfully.' };
  }
}
