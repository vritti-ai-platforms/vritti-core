import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { InventoryBatchResponseDto } from '../dto/response/inventory-batch-response.dto';

@Injectable()
export class InventoryItemQuantsGatewayService {
  private readonly logger = new Logger(InventoryItemQuantsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns a single inventory batch by ID
  async findById(id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.findQuantById', { id });
  }

  // Deletes an inventory batch
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeQuant — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.removeQuant', { id });
  }

  // Returns paginated ledger entries for a batch data table
  async findLedgerTable(batchId: string, userId: string) {
    this.logger.log('inventoryItems.quantLedgerTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, `inventory-item-quant-${batchId}-ledger`);

    const { result, count } = await this.nats.send<{ result: any[]; count: number }>(
      'commerce',
      'inventoryItems.quantLedgerTable',
      { batchId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  async select(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuants — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItems.selectQuants', query);
  }

}
