import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, type SuccessResponseDto } from '@vritti/api-sdk';
import type { InventoryBatchResponseDto } from '../dto/response/inventory-batch-response.dto';

@Injectable()
export class InventoryItemBatchesGatewayService {
  private readonly logger = new Logger(InventoryItemBatchesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns a single inventory batch by ID
  async findById(id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`inventoryItemBatches.findById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItemBatches.findById', { id });
  }

  // Deletes an inventory batch
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItemBatches.delete — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItemBatches.delete', { id });
  }

  // Returns paginated ledger entries for a batch data table
  async findLedgerTable(batchId: string, userId: string) {
    this.logger.log('inventoryItemBatches.ledgerTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, `inventory-item-batch-${batchId}-ledger`);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: any[]; count: number }>(
      'commerce',
      'inventoryItemBatches.ledgerTable',
      {
        batchId,
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated stock adjustments for a batch data table
  async findAdjustmentsTable(batchId: string, userId: string) {
    this.logger.log('inventoryItemBatches.adjustmentsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, `inventory-item-batch-${batchId}-adjustments`);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: any[]; count: number }>(
      'commerce',
      'inventoryItemBatches.adjustmentsTable',
      {
        batchId,
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }
}
