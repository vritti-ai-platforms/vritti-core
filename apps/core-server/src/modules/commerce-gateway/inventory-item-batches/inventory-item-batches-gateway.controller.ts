import { Controller, Delete, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import type { InventoryBatchResponseDto } from './dto/response/inventory-batch-response.dto';
import { InventoryItemBatchesGatewayService } from './services/inventory-item-batches-gateway.service';

@ApiTags('Commerce - Inventory Item Batches')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('inventory-item-batches')
export class InventoryItemBatchesGatewayController {
  private readonly logger = new Logger(InventoryItemBatchesGatewayController.name);

  constructor(private readonly service: InventoryItemBatchesGatewayService) {}

  @Get(':id')
  findById(@Param('id') id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-item-batches/${id}`);
    return this.service.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/inventory-item-batches/${id}`);
    return this.service.delete(id);
  }

  @Get(':id/ledger/table')
  getLedgerTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/inventory-item-batches/${id}/ledger/table`);
    return this.service.findLedgerTable(id, userId);
  }
}
