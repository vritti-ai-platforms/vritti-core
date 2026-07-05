import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SerialsSelectQueryDto } from './dto/request/serials-select-query.dto';
import { InventoryItemSerialsGatewayService } from './services/inventory-item-serials-gateway.service';

@ApiTags('Commerce - Inventory Item Serials')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('inventory-item-serials')
export class InventoryItemSerialsGatewayController {
  private readonly logger = new Logger(InventoryItemSerialsGatewayController.name);

  constructor(private readonly service: InventoryItemSerialsGatewayService) {}

  @Get('select')
  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  select(@Query() query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-item-serials/select');
    return this.service.select(query);
  }
}
