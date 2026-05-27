import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { StockTransfersService } from '@domain/stock-transfers/services/stock-transfers.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  StockTransferStatusValues,
} from '@/db/schema';
import type { UpdateStockTransferStatusDto } from '../dto/request/update-stock-transfer-status.dto';

@Injectable()
export class StockTransfersRootService {
  private readonly logger = new Logger(StockTransfersRootService.name);

  constructor(
    private readonly stockTransfersService: StockTransfersService,
    private readonly batchesService: InventoryItemQuantsService,
    private readonly lotsService: InventoryItemLotsService,
  ) {}

  // Updates transfer status, handling batch operations for IN_TRANSIT and RECEIVED transitions.
  // App-layer resolves lots before calling createBatch so the domain quant service stays independent.
  async updateStatus(id: string, data: UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    const { transfer, currentStatus, newStatus } = await this.stockTransfersService.prepareStatusUpdate(id, data);

    // On IN_TRANSIT: deduct from source batch
    if (newStatus === StockTransferStatusValues.IN_TRANSIT && currentStatus === StockTransferStatusValues.REQUESTED) {
      if (data.fromBatchId) {
        await this.batchesService.adjustBatch({
          batchId: data.fromBatchId,
          quantity: -transfer.quantity,
          type: InventoryItemLedgerTypeValues.TRANSFER_OUT,
          referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_TRANSFER,
          referenceId: id,
          notes: `Transfer out to location ${data.toLocationId}`,
        });
      }
    }

    // On RECEIVED: create new batch in destination location, preserving source lot identity
    if (newStatus === StockTransferStatusValues.RECEIVED) {
      let lotId: string | undefined;

      if (data.fromBatchId) {
        // Load the source lot to preserve its identity at the destination
        const sourceLot = await this.batchesService.loadLotByQuantId(data.fromBatchId);
        if (sourceLot) {
          // findOrCreateLot ensures the lot exists for this item in the destination BU
          const lot = await this.lotsService.findOrCreateLot({
            inventoryItemId: transfer.inventoryItemId,
            lotNumber: sourceLot.lotNumber,
            manufacturingDate: sourceLot.manufacturingDate ?? null,
            expiryDate: sourceLot.expiryDate ?? '',
          });
          lotId = lot.id;
        }
      }

      await this.batchesService.createBatch({
        inventoryItemId: transfer.inventoryItemId,
        locationId: data.toLocationId,
        quantity: transfer.quantity,
        lotId: lotId ?? null,
        type: InventoryItemLedgerTypeValues.TRANSFER_IN,
        referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_TRANSFER,
        referenceId: id,
        notes: `Transfer in from location ${data.fromLocationId}`,
      });
    }

    this.logger.log(`stockTransfers.updateStatus — id: ${id}, status: ${currentStatus} -> ${newStatus}`);
    return this.stockTransfersService.applyStatus(id, data);
  }
}
