import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { LotsSelectQueryDto } from './dto/request/lots-select-query.dto';
import { InventoryItemLotsGatewayService } from './services/inventory-item-lots-gateway.service';

@ApiTags('Commerce - Inventory Item Lots')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('inventory-item-lots')
export class InventoryItemLotsGatewayController {
  private readonly logger = new Logger(InventoryItemLotsGatewayController.name);

  constructor(private readonly service: InventoryItemLotsGatewayService) {}

  @Get('select')
  select(@Query() query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-item-lots/select');
    return this.service.select(query);
  }
}
