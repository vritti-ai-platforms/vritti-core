import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemUomConversions, uom } from '@/db/schema';

interface ConversionPair {
  primaryUomQty: number;
  uomQty: number;
}

import { InventoryItemUomConversionDto } from '../dto/entity/inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsRepository } from '../repositories/inventory-item-uom-conversions.repository';

@Injectable()
export class InventoryItemUomConversionsService {
  private readonly logger = new Logger(InventoryItemUomConversionsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    uomName: { column: uom.name, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    primaryUomQty: { column: inventoryItemUomConversions.primaryUomQty, type: 'number' },
    uomQty: { column: inventoryItemUomConversions.uomQty, type: 'number' },
  };

  constructor(private readonly repository: InventoryItemUomConversionsRepository) {}

  // Returns paginated, filtered, sorted UOM conversions for an inventory item
  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
    currentBuId: string,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemUomConversionsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemUomConversionsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemUomConversionsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(inventoryItemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(inventoryItemUomConversions.createdAt)],
      limit,
      offset,
    });

    const usedUomIds = new Set(await this.repository.findUomIdsUsedBySupplierItems(inventoryItemId));

    return {
      result: result.map((row) => InventoryItemUomConversionDto.from(row, currentBuId, usedUomIds.has(row.uomId))),
      count,
    };
  }

  // Creates a per-item UOM conversion. Only base UOMs (no global derivation) are eligible —
  // derived UOMs already have a universal global factor and should not have per-item conversions.
  // App-layer is responsible for validating the UOM exists; caller passes the pre-fetched UOM context.
  async create(
    inventoryItemId: string,
    dto: { uomId: string } & ConversionPair,
    uomContext: { baseUnitId: string | null; name: string; symbol: string },
    currentBuId: string,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    if (uomContext.baseUnitId !== null) {
      throw new ValidationException({
        detail: 'Per-item conversions are only allowed for base UOMs. Derived UOMs use the global conversion factor.',
        errors: [{ field: 'uomId', message: 'Derived units already have a global conversion factor.' }],
      });
    }

    const inventoryItemPrimaryUomId = await this.repository.findInventoryItemPrimaryUomId(inventoryItemId);
    if (!inventoryItemPrimaryUomId) throw new NotFoundException('Inventory item not found.');
    if (inventoryItemPrimaryUomId === dto.uomId) {
      throw new ValidationException({
        detail:
          "An inventory item's primary UOM cannot have a per-inventory-item conversion (it would be 1:1 with itself).",
        errors: [{ field: 'uomId', message: "This is the inventory item's primary UOM — pick a different one." }],
      });
    }

    validateConversionPair(dto);

    const existing = await this.repository.findByInventoryItemAndUom(inventoryItemId, dto.uomId);
    if (existing) {
      throw new ValidationException({
        detail: 'A conversion for this unit already exists on this item.',
        errors: [{ field: 'uomId', message: 'A conversion for this unit already exists on this item.' }],
      });
    }

    const uomConversion = await this.repository.create({
      inventoryItemId,
      uomId: dto.uomId,
      primaryUomQty: dto.primaryUomQty,
      uomQty: dto.uomQty,
    });
    this.logger.log(
      `Created UOM conversion for inventory item ${inventoryItemId}: uomId=${dto.uomId}, primaryUomQty=${dto.primaryUomQty}, uomQty=${dto.uomQty}`,
    );
    return {
      success: true,
      message: 'UOM conversion created successfully.',
      data: InventoryItemUomConversionDto.from(
        { ...uomConversion, uomName: uomContext.name, uomSymbol: uomContext.symbol },
        currentBuId,
      ),
    };
  }

  // Updates an existing UOM conversion's ratio
  async update(id: string, dto: ConversionPair, _currentBuId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM conversion not found.');

    validateConversionPair(dto);

    await this.repository.update(id, {
      primaryUomQty: dto.primaryUomQty,
      uomQty: dto.uomQty,
      updatedAt: new Date(),
    });
    this.logger.log(`Updated UOM conversion ${id}: primaryUomQty=${dto.primaryUomQty}, uomQty=${dto.uomQty}`);
    return { success: true, message: 'UOM conversion updated successfully.' };
  }

  // Deletes a UOM conversion by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM conversion not found.');

    if (await this.repository.isUsedBySupplierItem(existing.inventoryItemId, existing.uomId)) {
      const unit = existing.uomSymbol ? `${existing.uomName} (${existing.uomSymbol})` : existing.uomName;
      throw new ConflictException(
        `Can't delete the ${unit ?? 'unit'} conversion — a supplier item is priced in this unit. Remove or repoint those supplier items first.`,
      );
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted UOM conversion ${id}`);
    return { success: true, message: 'UOM conversion deleted successfully.' };
  }
}

// Validates a positive-integer conversion pair. One side must be 1 to keep ratios canonical.
function validateConversionPair(pair: ConversionPair): void {
  if (!Number.isInteger(pair.primaryUomQty) || pair.primaryUomQty <= 0) {
    throw new ValidationException({
      detail: 'primaryUomQty must be a positive integer.',
      errors: [{ field: 'primaryUomQty', message: 'Must be a positive integer.' }],
    });
  }
  if (!Number.isInteger(pair.uomQty) || pair.uomQty <= 0) {
    throw new ValidationException({
      detail: 'uomQty must be a positive integer.',
      errors: [{ field: 'uomQty', message: 'Must be a positive integer.' }],
    });
  }
  if (pair.primaryUomQty !== 1 && pair.uomQty !== 1) {
    throw new ValidationException({
      detail: 'One side of the ratio must be 1 (e.g. 1:10 or 50:1).',
    });
  }
}
