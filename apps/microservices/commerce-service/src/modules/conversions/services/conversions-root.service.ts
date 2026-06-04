import { ConversionsService } from '@domain/conversions/services/conversions.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { InventoryItemLedgerReferenceTypeValues, InventoryItemLedgerTypeValues } from '@/db/schema';

@Injectable()
export class ConversionsRootService {
  private readonly logger = new Logger(ConversionsRootService.name);

  constructor(
    private readonly conversionsService: ConversionsService,
    private readonly batchesService: InventoryItemQuantsService,
    private readonly quantsRepository: InventoryItemQuantsRepository,
    private readonly lotsService: InventoryItemLotsService,
  ) {}

  // Completes a conversion: validates status, deducts input batches, creates output batches, marks completed.
  // Output cost is rolled up from the inputs: total input cost (unit_cost × consumed qty, wastage included)
  // is allocated across outputs by output quantity. App-layer resolves lots before calling createQuant.
  async complete(
    id: string,
    locationId: string,
    inputBatchIds?: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    const { inputs, outputs } = await this.conversionsService.prepareComplete(id);

    // Deduct inputs from specified batches, accumulating their landed cost for the output roll-up.
    let totalInputCost = new Decimal(0);
    let costCurrency: string | undefined;
    for (const input of inputs) {
      const totalDeduct = input.quantity + input.wastageQuantity;
      const batchId = inputBatchIds?.[input.inventoryItemId];
      if (!batchId) {
        throw new BadRequestException(`Select a source quant for input item ${input.inventoryItemId}.`);
      }

      const sourceQuant = await this.quantsRepository.findById(batchId);
      if (!sourceQuant) throw new BadRequestException(`Source quant ${batchId} not found.`);
      const inputUnitCost = new Decimal(sourceQuant.unitCost?.toString() ?? '0');
      totalInputCost = totalInputCost.plus(inputUnitCost.times(totalDeduct));
      costCurrency ??= sourceQuant.costCurrency ?? undefined;

      await this.batchesService.adjustQuant({
        quantId: batchId,
        quantity: -totalDeduct,
        type: InventoryItemLedgerTypeValues.CONVERSION_INPUT,
        referenceType: InventoryItemLedgerReferenceTypeValues.CONVERSION,
        referenceId: id,
        notes: `Conversion input (qty: ${input.quantity}, wastage: ${input.wastageQuantity})`,
      });
    }

    const totalOutputQty = outputs.reduce((sum, output) => sum + output.quantity, 0);
    if (totalOutputQty <= 0) {
      throw new BadRequestException('Conversion has no output quantity.');
    }
    if (totalInputCost.lte(0)) {
      throw new BadRequestException('Conversion inputs have no cost; cannot value the outputs.');
    }

    // Create output batches. Auto-generates a lot number for tracking='lot' outputs.
    // TODO: conversion UX should let operators capture expiry per output lot (typically derived from
    // shortest input expiry). Until then we synthesize a 1-year-out placeholder.
    const placeholderExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    for (const output of outputs) {
      const autoLotNumber = `CONV-${id.slice(0, 8)}-${output.inventoryItemId.slice(0, 8)}`;

      // Allocate total input cost across outputs by quantity, then derive per-unit cost (BU minor).
      const allocatedCost = totalInputCost.times(output.quantity).div(totalOutputQty);
      const unitCost = BigInt(allocatedCost.div(output.quantity).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
      if (unitCost <= 0n) {
        throw new BadRequestException(`Computed output cost is not positive for item ${output.inventoryItemId}.`);
      }

      // Resolve the lot first so createQuant receives a pre-resolved lotId
      const lot = await this.lotsService.findOrCreateLot({
        inventoryItemId: output.inventoryItemId,
        lotNumber: autoLotNumber,
        expiryDate: placeholderExpiry,
      });

      await this.batchesService.createQuant({
        inventoryItemId: output.inventoryItemId,
        locationId,
        quantity: output.quantity,
        unitCost,
        costCurrency,
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
