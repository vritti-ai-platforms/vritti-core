import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import {
  type ConversionStatus,
  ConversionStatusValues,
  conversions,
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
} from '@/db/schema';
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

  constructor(
    private readonly repository: ConversionsRepository,
    private readonly batchesService: InventoryItemQuantsService,
  ) {}

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

  // Completes a conversion: deducts inputs from batches, creates output batches
  async complete(
    id: string,
    locationId: string,
    inputBatchIds?: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
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

    // Deduct inputs from specified batches
    for (const input of inputs) {
      const totalDeduct = Number(input.quantity) + Number(input.wastageQuantity);
      const batchId = inputBatchIds?.[input.inventoryItemId];

      if (batchId) {
        await this.batchesService.adjustBatch({
          batchId,
          quantity: -totalDeduct,
          type: InventoryItemLedgerTypeValues.CONVERSION_INPUT,
          referenceType: InventoryItemLedgerReferenceTypeValues.CONVERSION,
          referenceId: id,
          notes: `Conversion input (qty: ${input.quantity}, wastage: ${input.wastageQuantity})`,
        });
      }
    }

    // Create output batches. Auto-generates a lot number for tracking='lot' outputs.
    // TODO: conversion UX should let operators capture expiry per output lot (typically derived from
    // shortest input expiry). Until then we synthesize a 1-year-out placeholder.
    const placeholderExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    for (const output of outputs) {
      const autoLot = `CONV-${id.slice(0, 8)}-${output.inventoryItemId.slice(0, 8)}`;
      await this.batchesService.createBatch({
        inventoryItemId: output.inventoryItemId,
        locationId,
        quantity: Number(output.quantity),
        // For tracking='quantity' the service will reject `lot`; we let the service decide based on tracking.
        // Items with tracking='serial' will fail here — conversion of serialized goods is a follow-up.
        lot: { lotNumber: autoLot, expiryDate: placeholderExpiry },
        type: InventoryItemLedgerTypeValues.CONVERSION_OUTPUT,
        referenceType: InventoryItemLedgerReferenceTypeValues.CONVERSION,
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
