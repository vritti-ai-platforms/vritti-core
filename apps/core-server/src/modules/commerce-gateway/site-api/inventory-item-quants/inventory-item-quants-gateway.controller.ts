import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import type { InventoryBatchResponseDto } from '@commerce/inventory-item-quants/dto/response/inventory-batch-response.dto';
import { InventoryItemQuantsGatewayService } from './services/inventory-item-quants-gateway.service';

@ApiTags('Commerce - Inventory Item Batches')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('inventory-item-quants')
export class InventoryItemQuantsGatewayController {
  private readonly logger = new Logger(InventoryItemQuantsGatewayController.name);

  constructor(private readonly service: InventoryItemQuantsGatewayService) {}

  @Get(':id')
  findById(@Param('id') id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-item-quants/${id}`);
    return this.service.findById(id);
  }
}
