import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  BadRequestException,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type ConversionStatus, conversions, ConversionStatusValues, InventoryLedgerTypeValues } from '@/db/schema';
import {
  ConversionDetailDto,
  ConversionDto,
  ConversionInputDto,
  ConversionOutputDto,
} from '../dto/entity/conversion.dto';
import type { CreateConversionDto } from '@/modules/conversions/dto/request/create-conversion.dto';
import { ConversionsRepository } from '../repositories/conversions.repository';
import { InventoryLevelsService } from '@domain/inventory-levels/services/inventory-levels.service';

@Injectable()
export class ConversionsService {
  private readonly logger = new Logger(ConversionsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    status: { column: conversions.status, type: 'string' },
  };

  constructor(
    private readonly repository: ConversionsRepository,
    private readonly inventoryLevelsService: InventoryLevelsService,
  ) {}

  // Returns paginated conversions for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: ConversionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, ConversionsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, ConversionsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, ConversionsService.FIELD_MAP);

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(conversions.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: rows.map(ConversionDto.from), count };
  }

  // Creates a new conversion with inputs and outputs
  async create(data: CreateConversionDto): Promise<ConversionDetailDto> {
    const entity = await this.repository.create({
      bomId: data.bomId ?? null,
      status: (data.status as ConversionStatus) ?? ConversionStatusValues.DRAFT,
      producedBy: data.producedBy ?? null,
      startedAt: data.startedAt ? new Date(data.startedAt) : null,
      notes: data.notes ?? null,
    });

    const inputEntities = await this.repository.createInputs(
      data.inputs.map((input) => ({
        conversionId: entity.id,
        inventoryItemId: input.inventoryItemId,
        quantity: String(input.quantity),
        wastageQuantity: String(input.wastageQuantity ?? 0),
      })),
    );

    const outputEntities = await this.repository.createOutputs(
      data.outputs.map((output) => ({
        conversionId: entity.id,
        inventoryItemId: output.inventoryItemId,
        quantity: String(output.quantity),
        wastageQuantity: String(output.wastageQuantity ?? 0),
      })),
    );

    this.logger.log(`Created conversion ${entity.id} with ${inputEntities.length} inputs, ${outputEntities.length} outputs`);

    const inputDtos = inputEntities.map((i) => ConversionInputDto.from(i));
    const outputDtos = outputEntities.map((o) => ConversionOutputDto.from(o));
    return ConversionDetailDto.fromDetail(entity, inputDtos, outputDtos);
  }

  // Returns conversion detail with inputs and outputs
  async findById(id: string): Promise<ConversionDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Conversion not found.');

    const inputRows = await this.repository.findInputsByConversionId(id);
    const outputRows = await this.repository.findOutputsByConversionId(id);

    const inputDtos = inputRows.map((r) => ConversionInputDto.from(r, r.inventoryItemName));
    const outputDtos = outputRows.map((r) => ConversionOutputDto.from(r, r.inventoryItemName));
    return ConversionDetailDto.fromDetail(entity, inputDtos, outputDtos);
  }

  // Completes a conversion: deducts inputs, adds outputs via InventoryLevelsService
  async complete(id: string, locationId: string): Promise<{ success: boolean; message: string }> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Conversion not found.');
    if (entity.status === ConversionStatusValues.COMPLETED) {
      throw new BadRequestException('Conversion is already completed.');
    }
    if (entity.status === ConversionStatusValues.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled conversion.');
    }

    const inputs = await this.repository.findInputsByConversionId(id);
    const outputs = await this.repository.findOutputsByConversionId(id);

    // Deduct inputs from inventory
    for (const input of inputs) {
      const totalDeduct = Number(input.quantity) + Number(input.wastageQuantity);
      await this.inventoryLevelsService.deductStock({
        itemId: input.inventoryItemId,
        locationId,
        quantity: totalDeduct,
        type: InventoryLedgerTypeValues.CONVERSION_INPUT,
        referenceType: 'CONVERSION',
        referenceId: id,
        notes: `Conversion input (qty: ${input.quantity}, wastage: ${input.wastageQuantity})`,
      });
    }

    // Add outputs to inventory
    for (const output of outputs) {
      await this.inventoryLevelsService.addStock({
        itemId: output.inventoryItemId,
        locationId,
        quantity: Number(output.quantity),
        type: InventoryLedgerTypeValues.CONVERSION_OUTPUT,
        referenceType: 'CONVERSION',
        referenceId: id,
        notes: `Conversion output (qty: ${output.quantity})`,
      });
    }

    // Mark completed
    await this.repository.update(id, {
      status: ConversionStatusValues.COMPLETED,
      completedAt: new Date(),
    });

    this.logger.log(`Completed conversion: ${id}`);
    return { success: true, message: 'Conversion completed successfully.' };
  }
}
