import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import type { InventoryLedgerDto } from '@domain/inventory-ledger/dto/entity/inventory-ledger.dto';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import { InventoryItemsQuantsService } from './services/inventory-items-quants.service';

@Controller()
export class InventoryItemsQuantsController {
  private readonly logger = new Logger(InventoryItemsQuantsController.name);

  constructor(
    private readonly service: InventoryItemQuantsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly itemsQuantsService: InventoryItemsQuantsService,
  ) {}

  @MessagePattern({ cmd: 'inventoryItems.quantsTable' })
  async quantsTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`inventoryItems.quantsTable — itemId: ${data.itemId}`);
    return this.itemsQuantsService.findForTable(data.itemId, data);
  }

  @MessagePattern({ cmd: 'inventoryItems.findQuantById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemQuantDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${data.id}`);
    return this.service.findQuantById(data.id);
  }

  @MessagePattern({ cmd: 'inventoryItems.removeQuant' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeQuant — id: ${data.id}`);
    await this.service.deleteQuant(data.id);
    return { success: true, message: 'Quant deleted successfully.' };
  }

  @MessagePattern({ cmd: 'inventoryItems.quantLedgerTable' })
  async ledgerTable(
    @Payload() data: { batchId: string } & TableViewState,
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItems.quantLedgerTable — batchId: ${data.batchId}`);
    return this.ledgerService.findByBatch(data.batchId, data);
  }

  @MessagePattern({ cmd: 'inventoryItems.selectQuants' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuants — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForSelect(data);
  }
}
