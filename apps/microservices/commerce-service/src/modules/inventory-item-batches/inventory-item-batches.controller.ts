import type { InventoryItemBatchDto, InventoryLedgerDto } from '@domain/inventory-item-batches/dto/entity/inventory-item-batch.dto';
import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition, SuccessResponseDto } from '@vritti/api-sdk';

@Controller()
export class InventoryItemBatchesController {
  private readonly logger = new Logger(InventoryItemBatchesController.name);

  constructor(private readonly service: InventoryItemBatchesService) {}

  // Returns a single inventory batch by ID
  @MessagePattern({ cmd: 'inventoryItemBatches.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemBatchDto> {
    this.logger.log(`inventoryItemBatches.findById — id: ${data.id}`);
    return this.service.findBatchById(data.id);
  }

  // Deletes an inventory batch (only if no non-OPENING_STOCK/CORRECTION ledger entries)
  @MessagePattern({ cmd: 'inventoryItemBatches.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItemBatches.delete — id: ${data.id}`);
    await this.service.deleteBatch(data.id);
    return { success: true, message: 'Batch deleted successfully.' };
  }

  // Returns paginated ledger entries for a batch
  @MessagePattern({ cmd: 'inventoryItemBatches.ledgerTable' })
  async ledgerTable(
    @Payload() data: { batchId: string; filters: FilterCondition[]; sort: SortCondition[]; search: SearchState | null; pagination: { limit: number; offset: number } },
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItemBatches.ledgerTable — batchId: ${data.batchId}`);
    return this.service.findBatchLedger(data.batchId, {
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  // Returns paginated stock adjustments for a batch
  @MessagePattern({ cmd: 'inventoryItemBatches.adjustmentsTable' })
  async adjustmentsTable(
    @Payload() data: { batchId: string; filters: FilterCondition[]; sort: SortCondition[]; search: SearchState | null; pagination: { limit: number; offset: number } },
  ): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    this.logger.log(`inventoryItemBatches.adjustmentsTable — batchId: ${data.batchId}`);
    return this.service.findBatchAdjustments(data.batchId, {
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }
}
