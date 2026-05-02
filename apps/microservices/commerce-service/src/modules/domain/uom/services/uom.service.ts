import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { uom } from '@/db/schema';
import type { CreateUomDto } from '@/modules/uom/dto/request/create-uom.dto';
import type { UpdateUomDto } from '@/modules/uom/dto/request/update-uom.dto';
import { UomDto } from '../dto/entity/uom.dto';
import { UomRepository } from '../repositories/uom.repository';

@Injectable()
export class UomService {
  private readonly logger = new Logger(UomService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: uom.name, type: 'string' },
    symbol: { column: uom.symbol, type: 'string' },
    conversionFactor: { column: uom.conversionFactor, type: 'number' },
  };

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns paginated UOMs for the data table, scoped to a dimension
  async findForTable(state: TableViewState & { dimensionId: string }): Promise<{ result: UomDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, UomService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, UomService.FIELD_MAP);
    const dimensionWhere = eq(uom.dimensionId, state.dimensionId);
    const where = and(dimensionWhere, filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, UomService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.uomRepository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(uom.createdAt)],
      limit,
      offset,
    });

    const referencedIds = await this.uomRepository.findReferencedIds(rows.map((r) => r.id));
    return {
      result: rows.map((row) => UomDto.from(row, !referencedIds.has(row.id))),
      count,
    };
  }

  // Returns base units, optionally filtered by search
  async findBaseUnits(search?: string): Promise<UomDto[]> {
    const entities = await this.uomRepository.findBaseUnits(search);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, !referencedIds.has(e.id)));
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<UomDto[]> {
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new NotFoundException('Base unit not found.');
    const entities = await this.uomRepository.findDerivedUnits(baseUnitId);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, !referencedIds.has(e.id)));
  }

  // Returns paginated UOM options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.uomRepository.findForSelect({
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

  // Validates that baseUnitId exists and is not self-referencing
  private async validateBaseUnitId(baseUnitId: string, selfId?: string): Promise<void> {
    if (selfId && baseUnitId === selfId) {
      throw new BadRequestException('A unit of measure cannot reference itself as its base unit.');
    }
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new BadRequestException('The specified base unit does not exist.');
  }

  // Creates a new UOM
  async create(data: CreateUomDto): Promise<CreateResponseDto<UomDto>> {
    if (data.baseUnitId) await this.validateBaseUnitId(data.baseUnitId);

    const dup = await this.uomRepository.findBySymbol(data.symbol);
    if (dup) {
      throw new ConflictException({
        label: 'Duplicate Symbol',
        detail: `A unit with symbol "${data.symbol}" already exists.`,
      });
    }

    const entity = await this.uomRepository.create({
      dimensionId: data.dimensionId,
      name: data.name,
      symbol: data.symbol,
      baseUnitId: data.baseUnitId ?? null,
      conversionFactor: data.conversionFactor ?? 1,
    });

    this.logger.log(`Created UOM: ${entity.name} (${entity.symbol})`);
    return {
      success: true,
      message: `Unit "${entity.name}" (${entity.symbol}) created successfully.`,
      data: UomDto.from(entity),
    };
  }

  // Finds a UOM by ID or throws NotFoundException
  async findById(id: string): Promise<UomDto> {
    const entity = await this.uomRepository.findById(id);
    if (!entity) throw new NotFoundException('Unit of measure not found.');
    return UomDto.from(entity);
  }

  // Updates a UOM
  async update(id: string, data: UpdateUomDto): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    if (data.baseUnitId) await this.validateBaseUnitId(data.baseUnitId, id);

    if (data.symbol && data.symbol !== existing.symbol) {
      const dup = await this.uomRepository.findBySymbol(data.symbol);
      if (dup && dup.id !== id) {
        throw new ConflictException({
          label: 'Duplicate Symbol',
          detail: `A unit with symbol "${data.symbol}" already exists.`,
        });
      }
    }

    const updated = await this.uomRepository.update(id, data);
    this.logger.log(`Updated UOM: ${updated.name} (${updated.symbol})`);
    return { success: true, message: `Unit "${updated.name}" updated successfully.` };
  }

  // Deletes a UOM by ID; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.uomRepository.findById(id);
    if (!existing) throw new NotFoundException('Unit of measure not found.');
    const refs = await this.uomRepository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.inventoryItems, 'inventory item'],
      [refs.supplierItems, 'supplier item'],
      [refs.derivedUnits, 'derived unit'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Unit In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }
    await this.uomRepository.delete(id);
    this.logger.log(`Deleted UOM: ${existing.name} (${id})`);
    return { success: true, message: `Unit "${existing.name}" deleted successfully.` };
  }
}
