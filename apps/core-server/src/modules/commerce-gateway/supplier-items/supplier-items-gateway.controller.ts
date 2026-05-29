import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SelectQueryResult } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SupplierItemsSelectQueryDto } from './dto/request/supplier-items-select-query.dto';
import { SupplierItemsGatewayService } from './services/supplier-items-gateway.service';

@ApiTags('Commerce - Supplier Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('supplier-items')
export class SupplierItemsGatewayController {
  private readonly logger = new Logger(SupplierItemsGatewayController.name);

  constructor(private readonly service: SupplierItemsGatewayService) {}

  // Returns paginated supplier item options for select/filter components
  @Get('select')
  select(@Query() query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/supplier-items/select');
    return this.service.select(query);
  }
}
