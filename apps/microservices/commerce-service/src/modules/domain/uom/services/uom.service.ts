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
import { and, desc, eq, isNotNull, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { inventoryItemUomConversions, purchaseOrderItems, supplierItems, uom, uomDimensions } from '@/db/schema';
import type { CreateUomDto } from '@/modules/organization/uom/dto/request/create-uom.dto';
import type { UpdateUomDto } from '@/modules/organization/uom/dto/request/update-uom.dto';
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
    baseUomQty: { column: uom.baseUomQty, type: 'number' },
    uomQty: { column: uom.uomQty, type: 'number' },
  };

  constructor(private readonly uomRepository: UomRepository) {}

  // Returns paginated UOMs for the data table, scoped to a dimension; joined with base unit symbol
  async findForTable(state: TableViewState & { dimensionId: string }): Promise<{ result: UomDto[]; count: number }> {
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
      result: rows.map((row) => UomDto.from(row, !referencedIds.has(row.id), row.baseUnitSymbol)),
      count,
    };
  }

  // Returns paginated UOM options for select dropdowns. When `inventoryItemId` is set, the
  // result is restricted to that item's allowed-UOMs set (see UomRepository.allowedUomIdsForItemSubquery).
  // When `supplierId` is also set (no purchaseOrderId): restricts to UOMs the supplier offers for this item,
  //   excluding UOMs already linked to the supplier for this item.
  // When `supplierId` + `purchaseOrderId` are both set: restricts to UOMs in supplier_items for this
  //   supplier+item, excluding UOMs already on the PO for this item.
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: {
      derivedOnly?: boolean;
      baseOnly?: boolean;
      dimensionId?: string;
      inventoryItemId?: string;
      supplierId?: string;
      purchaseOrderId?: string;
    },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];
    if (options?.derivedOnly) conditions.push(isNotNull(uom.baseUnitId));
    if (options?.baseOnly) conditions.push(isNull(uom.baseUnitId));
    if (options?.dimensionId) conditions.push(eq(uom.dimensionId, options.dimensionId));

    if (options?.inventoryItemId && options?.supplierId && options?.purchaseOrderId) {
      // Restrict to UOMs the supplier offers for this item, minus UOMs already on the PO for this item
      conditions.push(sql`${uom.id} IN (
        SELECT si.uom_id FROM ${supplierItems} si
        WHERE si.supplier_id = ${options.supplierId}
          AND si.inventory_item_id = ${options.inventoryItemId}
          AND NOT EXISTS (
            SELECT 1 FROM ${purchaseOrderItems} poi
            WHERE poi.purchase_order_id = ${options.purchaseOrderId}
              AND poi.inventory_item_id = ${options.inventoryItemId}
              AND poi.uom_id = si.uom_id
          )
      )`);
    } else if (options?.inventoryItemId && options?.supplierId) {
      // Restrict to allowed UOMs for the item, excluding UOMs already linked to this supplier+item
      conditions.push(sql`${uom.id} IN ${this.uomRepository.allowedUomIdsForItemSubquery(options.inventoryItemId)}`);
      conditions.push(sql`${uom.id} NOT IN (
        SELECT si.uom_id FROM ${supplierItems} si
        WHERE si.supplier_id = ${options.supplierId}
          AND si.inventory_item_id = ${options.inventoryItemId}
      )`);
    } else if (options?.inventoryItemId) {
      conditions.push(sql`${uom.id} IN ${this.uomRepository.allowedUomIdsForItemSubquery(options.inventoryItemId)}`);
    }

    const joins =
      options?.inventoryItemId && !options?.supplierId
        ? [
            {
              table: inventoryItemUomConversions,
              on: and(
                eq(inventoryItemUomConversions.uomId, uom.id),
                eq(inventoryItemUomConversions.inventoryItemId, options.inventoryItemId),
              ) as SQL,
              type: 'left' as const,
            },
          ]
        : undefined;

    // COALESCE defaults null primaryUomQty/uomQty to 1 for the primary UOM (no conversion row in the LEFT JOIN)
    const additionalExpressions =
      options?.inventoryItemId && !options?.supplierId
        ? {
            primaryUomQty: sql<number>`COALESCE(${inventoryItemUomConversions.primaryUomQty}, 1)`,
            uomQty: sql<number>`COALESCE(${inventoryItemUomConversions.uomQty}, 1)`,
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
      baseUomQty: data.baseUomQty ?? 1,
      uomQty: data.uomQty ?? 1,
      allowDecimal: data.allowDecimal ?? true,
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
