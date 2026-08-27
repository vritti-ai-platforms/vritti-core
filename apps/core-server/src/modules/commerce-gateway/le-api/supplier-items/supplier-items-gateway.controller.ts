import { SupplierItemsSelectQueryDto } from '@commerce/supplier-items/dto/request/supplier-items-select-query.dto';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { SelectQueryResult } from '@vritti/api-sdk/database';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature } from '@/rbac/decorators';
import { SupplierItemsGatewayService } from './services/supplier-items-gateway.service';

@ApiTags('Commerce - Supplier Items')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_SUPPLIERS.featureCode)
@Controller('le/supplier-items')
export class SupplierItemsGatewayController {
  private readonly logger = new Logger(SupplierItemsGatewayController.name);

  constructor(private readonly supplierItemsGatewayService: SupplierItemsGatewayService) {}

  // Returns supplier items as selectable dropdown options
  @Get('select')
  select(@Query() query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/le/supplier-items/select');
    return this.supplierItemsGatewayService.findForSelect(query);
  }
}
