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
import { and, desc, eq, isNotNull, isNull, sql, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemUomConversions, uom, uomDimensions } from '@/db/schema';
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
    baseUnitId: { column: uom.baseUnitId, type: 'string' },
    // Virtual field: 'base' → base_unit_id IS NULL; 'derived' → base_unit_id IS NOT NULL
    kind: {
      type: 'string',
      expression: (value) => (value === 'base' ? isNull(uom.baseUnitId) : isNotNull(uom.baseUnitId)),
    },
    conversionFactor: { column: uom.conversionFactor, type: 'number' },
  };

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns paginated UOMs for the data table, scoped to a dimension; joined with base unit symbol
  async findForTable(
    state: TableViewState & { dimensionId: string },
    currentBuId: string,
  ): Promise<{ result: UomDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, UomService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, UomService.FIELD_MAP);
    const dimensionWhere = eq(uom.dimensionId, state.dimensionId);
    const where = and(dimensionWhere, filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, UomService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.uomRepository.findForTableWithBase({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(uom.createdAt)],
      limit,
      offset,
    });

    const referencedIds = await this.uomRepository.findReferencedIds(rows.map((r) => r.id));
    return {
      result: rows.map((row) => UomDto.from(row, currentBuId, !referencedIds.has(row.id), row.baseUnitSymbol)),
      count,
    };
  }

  // Returns base units, optionally filtered by search
  async findBaseUnits(search: string | undefined, currentBuId: string): Promise<UomDto[]> {
    const entities = await this.uomRepository.findBaseUnits(search);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, currentBuId, !referencedIds.has(e.id)));
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string, currentBuId: string): Promise<UomDto[]> {
    const baseUnit = await this.uomRepository.findById(baseUnitId);
    if (!baseUnit) throw new NotFoundException('Base unit not found.');
    const entities = await this.uomRepository.findDerivedUnits(baseUnitId);
    const referencedIds = await this.uomRepository.findReferencedIds(entities.map((e) => e.id));
    return entities.map((e) => UomDto.from(e, currentBuId, !referencedIds.has(e.id)));
  }

  // Returns paginated UOM options for select dropdowns. When `inventoryItemId` is set, the
  // result is restricted to that item's allowed-UOMs set (see UomRepository.allowedUomIdsForItemSubquery).
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: { derivedOnly?: boolean; baseOnly?: boolean; dimensionId?: string; inventoryItemId?: string },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];
    if (options?.derivedOnly) conditions.push(isNotNull(uom.baseUnitId));
    if (options?.baseOnly) conditions.push(isNull(uom.baseUnitId));
    if (options?.dimensionId) conditions.push(eq(uom.dimensionId, options.dimensionId));
    if (options?.inventoryItemId) {
      conditions.push(sql`${uom.id} IN ${this.uomRepository.allowedUomIdsForItemSubquery(options.inventoryItemId)}`);
    }

    const joins = options?.inventoryItemId
      ? [{ table: inventoryItemUomConversions, on: and(eq(inventoryItemUomConversions.uomId, uom.id), eq(inventoryItemUomConversions.inventoryItemId, options.inventoryItemId)) as SQL, type: 'left' as const }]
      : undefined;

    // COALESCE defaults null numerator/denominator to 1 for the primary UOM (no conversion row in the LEFT JOIN)
    const additionalExpressions = options?.inventoryItemId
      ? {
          numerator: sql<number>`COALESCE(${inventoryItemUomConversions.numerator}, 1)`,
          denominator: sql<number>`COALESCE(${inventoryItemUomConversions.denominator}, 1)`,
        }
      : undefined;

    return this.uomRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      additionalExpressions,
      groupIdKey: query.groupIdKey,
      ...(query.groupIdKey === 'dimensionId' ? { groupTable: uomDimensions } : {}),
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      ...(joins && { joins }),
      ...(conditions.length > 0 && { conditions }),
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

  // Creates a new UOM; newly created row belongs to the current BU so canEdit is always true
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
      // pass entity.businessUnitId so canEdit resolves to true for a freshly created row
      data: UomDto.from(entity, entity.businessUnitId),
    };
  }

  // Finds a UOM by ID or throws NotFoundException
  async findById(id: string, currentBuId: string): Promise<UomDto> {
    const entity = await this.uomRepository.findById(id);
    if (!entity) throw new NotFoundException('Unit of measure not found.');
    return UomDto.from(entity, currentBuId);
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
      [refs.uomOverrides, 'per-item override'],
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
