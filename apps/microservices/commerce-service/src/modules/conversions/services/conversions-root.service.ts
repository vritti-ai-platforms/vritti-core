import { ConversionsService } from '@domain/conversions/services/conversions.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Injectable, Logger } from '@nestjs/common';
import { InventoryItemLedgerReferenceTypeValues, InventoryItemLedgerTypeValues } from '@/db/schema';

@Injectable()
export class ConversionsRootService {
  private readonly logger = new Logger(ConversionsRootService.name);

  constructor(
    private readonly conversionsService: ConversionsService,
    private readonly batchesService: InventoryItemQuantsService,
    private readonly lotsService: InventoryItemLotsService,
  ) {}

  // Completes a conversion: validates status, deducts input batches, creates output batches, marks completed.
  // App-layer resolves lots before calling createBatch so the domain quant service stays independent.
  async complete(
    id: string,
    locationId: string,
    inputBatchIds?: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    const { inputs, outputs } = await this.conversionsService.prepareComplete(id);

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
      const autoLotNumber = `CONV-${id.slice(0, 8)}-${output.inventoryItemId.slice(0, 8)}`;

      // Resolve the lot first so createBatch receives a pre-resolved lotId
      const lot = await this.lotsService.findOrCreateLot({
        inventoryItemId: output.inventoryItemId,
        lotNumber: autoLotNumber,
        expiryDate: placeholderExpiry,
      });

      await this.batchesService.createBatch({
        inventoryItemId: output.inventoryItemId,
        locationId,
        quantity: Number(output.quantity),
        lotId: lot.id,
        type: InventoryItemLedgerTypeValues.CONVERSION_OUTPUT,
        referenceType: InventoryItemLedgerReferenceTypeValues.CONVERSION,
        referenceId: id,
        notes: `Conversion output (qty: ${output.quantity})`,
      });
    }

    this.logger.log(`conversions.complete — id: ${id}, outputs: ${outputs.length}`);
    return this.conversionsService.markCompleted(id);
  }
}
