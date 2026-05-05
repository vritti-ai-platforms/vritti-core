import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemUomConversions, uom } from '@/db/schema';
import { UomRepository } from '@domain/uom/repositories/uom.repository';
import { InventoryItemUomConversionDto } from '../dto/entity/inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsRepository } from '../repositories/inventory-item-uom-conversions.repository';

@Injectable()
export class InventoryItemUomConversionsService {
  private readonly logger = new Logger(InventoryItemUomConversionsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    uomName: { column: uom.name, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    conversionFactor: { column: inventoryItemUomConversions.conversionFactor, type: 'number' },
  };

  constructor(
    private readonly repository: InventoryItemUomConversionsRepository,
    private readonly uomRepository: UomRepository,
  ) {}

  // Returns paginated, filtered, sorted UOM overrides for an inventory item
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

  // Creates a per-item UOM override after validating the UOM is a derived unit and no duplicate exists
  async create(
    itemId: string,
    dto: { uomId: string; conversionFactor: number },
    currentBuId: string,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    const uomEntity = await this.uomRepository.findById(dto.uomId);
    if (!uomEntity) throw new NotFoundException('Unit of measure not found.');

    if (uomEntity.baseUnitId === null) {
      throw new BadRequestException({
        label: 'Base Unit',
        detail: 'Only derived units can have per-item overrides.',
      });
    }

    if (dto.conversionFactor <= 0) {
      throw new BadRequestException('Conversion factor must be greater than zero.');
    }

    const existing = await this.repository.findByItemAndUom(itemId, dto.uomId);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Override',
        detail: 'An override for this unit already exists on this item.',
      });
    }

    await this.repository.create({ inventoryItemId: itemId, uomId: dto.uomId, conversionFactor: dto.conversionFactor });
    const created = await this.repository.findByItemAndUom(itemId, dto.uomId);
    const row = await this.repository.findById(created!.id);
    this.logger.log(`Created UOM override for item ${itemId}: uomId=${dto.uomId}, factor=${dto.conversionFactor}`);
    return {
      success: true,
      message: 'UOM override created successfully.',
      data: InventoryItemUomConversionDto.from(row!, currentBuId),
    };
  }

  // Updates the conversion factor of an existing override
  async update(id: string, dto: { conversionFactor: number }, currentBuId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM override not found.');

    if (dto.conversionFactor <= 0) {
      throw new BadRequestException('Conversion factor must be greater than zero.');
    }

    await this.repository.update(id, { conversionFactor: dto.conversionFactor, updatedAt: new Date() });
    this.logger.log(`Updated UOM override ${id}: factor=${dto.conversionFactor}`);
    return { success: true, message: 'UOM override updated successfully.' };
  }

  // Deletes a UOM conversion override by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('UOM override not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted UOM override ${id}`);
    return { success: true, message: 'UOM override deleted successfully.' };
  }

  // Resolves the effective conversion factor: item override if present, otherwise the UOM's global default
  async resolveFactor(itemId: string, uomId: string): Promise<number> {
    const override = await this.repository.findByItemAndUom(itemId, uomId);
    if (override) return override.conversionFactor;
    const uomEntity = await this.uomRepository.findById(uomId);
    return uomEntity?.conversionFactor ?? 1;
  }
}
