import type { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import type { LeInboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-response.dto';
import type { LeInboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-table-response.dto';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { LE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { ApiFindById, ApiFindForTable, ApiLinesTable } from './docs/inbound-deliveries-gateway.docs';
import { LeInboundDeliveriesGatewayService } from './services/inbound-deliveries-gateway.service';

@ApiTags('Commerce - Inbound Deliveries')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_INBOUND_DELIVERIES.featureCode)
@Controller('le/inbound-deliveries')
export class LeInboundDeliveriesGatewayController {
  private readonly logger = new Logger(LeInboundDeliveriesGatewayController.name);

  constructor(private readonly service: LeInboundDeliveriesGatewayService) {}

  // Returns the inbound deliveries of the legal entity's sites for the data table
  @Get('table')
  @RequirePermission(LE_INBOUND_DELIVERIES.view)
  @ApiFindForTable()
  findForTable(@UserId() userId: string, @OrgId() orgId: string): Promise<LeInboundDeliveryTableResponseDto> {
    this.logger.log('GET /commerce-api/le/inbound-deliveries/table');
    return this.service.findForTable(userId, orgId);
  }

  // Returns one inbound delivery of the legal entity's sites
  @Get(':id')
  @RequirePermission(LE_INBOUND_DELIVERIES.view)
  @ApiFindById()
  findById(@Param('id') id: string, @OrgId() orgId: string): Promise<LeInboundDeliveryResponseDto> {
    this.logger.log(`GET /commerce-api/le/inbound-deliveries/${id}`);
    return this.service.findById(id, orgId);
  }

  // Returns an inbound delivery's lines for the data table
  @Get(':id/lines/table')
  @RequirePermission(LE_INBOUND_DELIVERIES.view)
  @ApiLinesTable()
  linesTable(@Param('id') id: string, @UserId() userId: string): Promise<InboundDeliveryLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inbound-deliveries/${id}/lines/table`);
    return this.service.findLinesTable(id, userId);
  }
}
