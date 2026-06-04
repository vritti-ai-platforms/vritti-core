import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import type { InventoryBatchResponseDto } from './dto/response/inventory-batch-response.dto';
import { InventoryItemQuantsGatewayService } from './services/inventory-item-quants-gateway.service';

@ApiTags('Commerce - Inventory Item Batches')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('inventory-item-quants')
export class InventoryItemQuantsGatewayController {
  private readonly logger = new Logger(InventoryItemQuantsGatewayController.name);

  constructor(private readonly service: InventoryItemQuantsGatewayService) {}

  @Get('select')
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  select(@Query() query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-item-quants/select');
    return this.service.select(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<InventoryBatchResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-item-quants/${id}`);
    return this.service.findById(id);
  }
}
