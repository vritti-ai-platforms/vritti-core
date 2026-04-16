import type { InventoryItemBatchDto } from '@domain/inventory-item-batches/dto/entity/inventory-item-batch.dto';
import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import type { InventoryLedgerDto } from '@domain/inventory-ledger/dto/entity/inventory-ledger.dto';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Controller()
export class InventoryItemBatchesController {
  private readonly logger = new Logger(InventoryItemBatchesController.name);

  constructor(
    private readonly service: InventoryItemBatchesService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  @MessagePattern({ cmd: 'inventoryItemBatches.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemBatchDto> {
    this.logger.log(`inventoryItemBatches.findById — id: ${data.id}`);
    return this.service.findBatchById(data.id);
  }

  @MessagePattern({ cmd: 'inventoryItemBatches.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItemBatches.delete — id: ${data.id}`);
    await this.service.deleteBatch(data.id);
    return { success: true, message: 'Batch deleted successfully.' };
  }

  @MessagePattern({ cmd: 'inventoryItemBatches.ledgerTable' })
  async ledgerTable(
    @Payload() data: { batchId: string } & TableViewState,
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItemBatches.ledgerTable — batchId: ${data.batchId}`);
    return this.ledgerService.findByBatch(data.batchId, data);
  }

  @MessagePattern({ cmd: 'inventoryItemBatches.select' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItemBatches.select — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForSelect(data);
  }
}
