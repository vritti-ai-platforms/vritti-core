import { UomRepository } from '@domain/uom/repositories/uom.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemUomConversions, uom } from '@/db/schema';
import { InventoryItemUomConversionDto } from '../dto/entity/inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsRepository } from '../repositories/inventory-item-uom-conversions.repository';

@Injectable()
export class InventoryItemUomConversionsService {
  private readonly logger = new Logger(InventoryItemUomConversionsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    uomName: { column: uom.name, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    numerator: { column: inventoryItemUomConversions.numerator, type: 'number' },
    denominator: { column: inventoryItemUomConversions.denominator, type: 'number' },
  };

  constructor(
    private readonly repository: InventoryItemUomConversionsRepository,
    private readonly uomRepository: UomRepository,
  ) {}

  // Returns paginated, filtered, sorted UOM conversions for an inventory item
  async findForTable(
    itemId: string,
    state: TableViewState,
    currentBuId: string,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemUomConversionsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemUomConversionsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemUomConversionsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(inventoryItemUomConversions.createdAt)],
      limit,
      offset,
    });

    return { result: result.map((row) => InventoryItemUomConversionDto.from(row, currentBuId)), count };
  }

  // Creates a per-item UOM conversion. Only base UOMs (no global derivation) are eligible —
  // derived UOMs already have a universal global factor and should not have per-item conversions.
  async create(
    inventoryItemId: string,
    dto: { uomId: string; numerator: number; denominator: number },
    currentBuId: string,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    const uomEntity = await this.uomRepository.findById(dto.uomId);
    if (!uomEntity) throw new NotFoundException('Unit of measure not found.');

    if (uomEntity.baseUnitId !== null) {
      throw new BadRequestException({
        label: 'Derived Unit',
        detail: 'Per-item conversions are only allowed for base UOMs. Derived UOMs use the global conversion factor.',
      });
    }

    const itemPrimaryUomId = await this.repository.findItemPrimaryUomId(inventoryItemId);
    if (!itemPrimaryUomId) throw new NotFoundException('Inventory item not found.');
    if (itemPrimaryUomId === dto.uomId) {
      throw new BadRequestException({
        label: 'Primary UOM',
        detail: "An item's primary UOM cannot have a per-item conversion (it would be 1:1 with itself).",
      });
    }

    if (!Number.isInteger(dto.numerator) || dto.numerator <= 0) {
      throw new ValidationException({
        detail: 'Numerator must be a positive integer.',
        errors: [{ field: 'numerator', message: 'Must be a positive integer.' }],
      });
    }
    if (!Number.isInteger(dto.denominator) || dto.denominator <= 0) {
      throw new ValidationException({
        detail: 'Denominator must be a positive integer.',
        errors: [{ field: 'denominator', message: 'Must be a positive integer.' }],
      });
    }
    if (dto.numerator !== 1 && dto.denominator !== 1) {
      throw new ValidationException({
        detail: 'One side of the ratio must be 1 (e.g. 1:10 or 50:1).',
        errors: [],
      });
    }

    const existing = await this.repository.findByItemAndUom(inventoryItemId, dto.uomId);
    if (existing) {
      throw new ValidationException({
        detail: 'A conversion for this unit already exists on this item.',
        errors: [{ field: 'uomId', message: 'A conversion for this unit already exists on this item.' }],
      });
    }

    const uomConversion = await this.repository.create({
      inventoryItemId,
      uomId: dto.uomId,
      numerator: dto.numerator,
      denominator: dto.denominator,
    });
    this.logger.log(
      `Created UOM conversion for item ${inventoryItemId}: uomId=${dto.uomId}, ${dto.numerator}/${dto.denominator}`,
    );
    return {
      success: true,
      message: 'UOM conversion created successfully.',
      data: InventoryItemUomConversionDto.from(
        { ...uomConversion, uomName: uomEntity.name, uomSymbol: uomEntity.symbol },
        currentBuId,
      ),
    };
  }

  // Updates an existing UOM conversion's ratio
  async update(
    id: string,
    dto: { numerator: number; denominator: number },
    _currentBuId: string,
  ): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM conversion not found.');

    if (!Number.isInteger(dto.numerator) || dto.numerator <= 0) {
      throw new ValidationException({
        detail: 'Numerator must be a positive integer.',
        errors: [{ field: 'numerator', message: 'Must be a positive integer.' }],
      });
    }
    if (!Number.isInteger(dto.denominator) || dto.denominator <= 0) {
      throw new ValidationException({
        detail: 'Denominator must be a positive integer.',
        errors: [{ field: 'denominator', message: 'Must be a positive integer.' }],
      });
    }
    if (dto.numerator !== 1 && dto.denominator !== 1) {
      throw new ValidationException({
        detail: 'One side of the ratio must be 1 (e.g. 1:10 or 50:1).',
      });
    }

    await this.repository.update(id, {
      numerator: dto.numerator,
      denominator: dto.denominator,
      updatedAt: new Date(),
    });
    this.logger.log(`Updated UOM conversion ${id}: ${dto.numerator}/${dto.denominator}`);
    return { success: true, message: 'UOM conversion updated successfully.' };
  }

  // Deletes a UOM conversion by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM conversion not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted UOM conversion ${id}`);
    return { success: true, message: 'UOM conversion deleted successfully.' };
  }

  async resolvePrimaryUomFactor(itemId: string, uomId: string): Promise<number> {
    const conversion = await this.repository.findByItemAndUom(itemId, uomId);
    if (conversion) {
      return new Decimal(conversion.numerator).dividedBy(conversion.denominator).toNumber();
    }
    const uomEntity = await this.uomRepository.findById(uomId);
    if (!uomEntity) throw new NotFoundException('Unit of measure not found.');
    return uomEntity.conversionFactor;
  }

  async resolvePrimaryUomQuantity(itemId: string, uomId: string, quantity: number): Promise<number> {
    const factor = await this.resolvePrimaryUomFactor(itemId, uomId);
    return new Decimal(quantity).times(factor).toDecimalPlaces(3).toNumber();
  }
}
