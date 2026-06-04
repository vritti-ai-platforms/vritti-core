import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { PurchaseOrderItemsSelectQueryDto } from './dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrderItemsGatewayService } from './services/purchase-order-items-gateway.service';

@ApiTags('Commerce - Purchase Order Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('purchase-order-items')
export class PurchaseOrderItemsGatewayController {
  private readonly logger = new Logger(PurchaseOrderItemsGatewayController.name);

  constructor(private readonly service: PurchaseOrderItemsGatewayService) {}

  // Returns paginated PO line options for the GR AddItem selector
  @Get('select')
  select(@Query() query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/purchase-order-items/select');
    return this.service.select(query);
  }
}
