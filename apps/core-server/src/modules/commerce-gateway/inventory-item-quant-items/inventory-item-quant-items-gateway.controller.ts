import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemQuantItemsGatewayService } from './services/inventory-item-quant-items-gateway.service';

@ApiTags('Commerce - Inventory Item Quant Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('inventory-item-quant-items')
export class InventoryItemQuantItemsGatewayController {
  private readonly logger = new Logger(InventoryItemQuantItemsGatewayController.name);

  constructor(private readonly service: InventoryItemQuantItemsGatewayService) {}

  @Get('select')
  select(@Query() query: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-item-quant-items/select');
    return this.service.select(query);
  }
}
