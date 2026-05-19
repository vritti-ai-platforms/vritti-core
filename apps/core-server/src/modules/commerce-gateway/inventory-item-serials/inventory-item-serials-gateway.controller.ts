import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemSerialsGatewayService } from './services/inventory-item-serials-gateway.service';

@ApiTags('Commerce - Inventory Item Serials')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('inventory-item-serials')
export class InventoryItemSerialsGatewayController {
  private readonly logger = new Logger(InventoryItemSerialsGatewayController.name);

  constructor(private readonly service: InventoryItemSerialsGatewayService) {}

  @Get('select')
  select(@Query() query: SelectOptionsQueryDto & { quantId: string }): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-item-serials/select');
    return this.service.select(query);
  }
}
