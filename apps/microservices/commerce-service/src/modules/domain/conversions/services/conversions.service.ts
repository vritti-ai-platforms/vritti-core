import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type ConversionStatus, ConversionStatusValues, conversions } from '@/db/schema';
import type { CreateConversionDto } from '@/modules/conversions/dto/request/create-conversion.dto';
import {
  ConversionDetailDto,
  ConversionDto,
  ConversionInputDto,
  ConversionOutputDto,
} from '../dto/entity/conversion.dto';
import { ConversionsRepository } from '../repositories/conversions.repository';

@Injectable()
export class ConversionsService {
  private readonly logger = new Logger(ConversionsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    status: { column: conversions.status, type: 'string' },
  };

  constructor(private readonly repository: ConversionsRepository) {}

  // Returns paginated conversions for the data table
  async findForTable(state: TableViewState): Promise<{ result: ConversionDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, ConversionsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, ConversionsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, ConversionsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(conversions.createdAt)],
      limit,
      offset,
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
        quantity: input.quantity,
        wastageQuantity: input.wastageQuantity ?? 0,
      })),
    );

    const outputEntities = await this.repository.createOutputs(
      data.outputs.map((output) => ({
        conversionId: entity.id,
        inventoryItemId: output.inventoryItemId,
        quantity: output.quantity,
        wastageQuantity: output.wastageQuantity ?? 0,
      })),
    );

    this.logger.log(
      `Created conversion ${entity.id} with ${inputEntities.length} inputs, ${outputEntities.length} outputs`,
    );

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

  // Validates and loads conversion data for completion. App-layer handles batch operations.
  // Returns the inputs/outputs so the caller can deduct and create batches.
  async prepareComplete(id: string): Promise<{
    inputs: { inventoryItemId: string; quantity: number; wastageQuantity: number }[];
    outputs: { inventoryItemId: string; quantity: number }[];
  }> {
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

    return {
      inputs: inputs.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity,
        wastageQuantity: i.wastageQuantity,
      })),
      outputs: outputs.map((o) => ({ inventoryItemId: o.inventoryItemId, quantity: o.quantity })),
    };
  }

  // Marks a conversion as completed. Call after batch operations have been applied by the app-layer.
  async markCompleted(id: string): Promise<{ success: boolean; message: string }> {
    await this.repository.update(id, {
      status: ConversionStatusValues.COMPLETED,
      completedAt: new Date(),
    });

    this.logger.log(`Completed conversion: ${id}`);
    return { success: true, message: 'Conversion completed successfully.' };
  }
}
