import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import type { InventoryLedgerDto } from '@domain/inventory-ledger/dto/entity/inventory-ledger.dto';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Controller()
export class InventoryItemQuantsController {
  private readonly logger = new Logger(InventoryItemQuantsController.name);

  constructor(
    private readonly service: InventoryItemQuantsService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  @MessagePattern({ cmd: 'inventoryItemQuants.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemQuantDto> {
    this.logger.log(`inventoryItemQuants.findById — id: ${data.id}`);
    return this.service.findBatchById(data.id);
  }

  @MessagePattern({ cmd: 'inventoryItemQuants.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItemQuants.delete — id: ${data.id}`);
    await this.service.deleteBatch(data.id);
    return { success: true, message: 'Batch deleted successfully.' };
  }

  @MessagePattern({ cmd: 'inventoryItemQuants.ledgerTable' })
  async ledgerTable(
    @Payload() data: { batchId: string } & TableViewState,
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItemQuants.ledgerTable — batchId: ${data.batchId}`);
    return this.ledgerService.findByBatch(data.batchId, data);
  }

  @MessagePattern({ cmd: 'inventoryItemQuants.select' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItemQuants.select — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForSelect(data);
  }
}
