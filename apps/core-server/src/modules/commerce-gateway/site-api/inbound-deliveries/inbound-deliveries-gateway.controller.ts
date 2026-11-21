import { AddInboundDeliveryLinesDto } from '@commerce/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import { CreateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import { SetInboundDeliveryStatusDto } from '@commerce/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import { UpdateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import { UpdateInboundDeliveryLineDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import type { InboundDeliveryCountsResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-counts-response.dto';
import type { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiAddLines,
  ApiCreate,
  ApiDelete,
  ApiFindById,
  ApiFindForTable,
  ApiFindInboundDeliveryCounts,
  ApiLinesTable,
  ApiRemoveLine,
  ApiSetStatus,
  ApiUpdate,
  ApiUpdateLine,
} from './docs/inbound-deliveries-gateway.docs';
import { InboundDeliveriesGatewayService } from './services/inbound-deliveries-gateway.service';

@ApiTags('Commerce - Inbound Deliveries')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_INBOUND_DELIVERIES.featureCode)
@Controller('site/inbound-deliveries')
export class InboundDeliveriesGatewayController {
  private readonly logger = new Logger(InboundDeliveriesGatewayController.name);

  constructor(private readonly service: InboundDeliveriesGatewayService) {}

  // Creates a planned inbound delivery of a supplier at the site
  @Post()
  @RequirePermission(SITE_INBOUND_DELIVERIES.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate()
  create(@Body() dto: CreateInboundDeliveryDto): Promise<CreateResponseDto<InboundDeliveryResponseDto>> {
    this.logger.log('POST /commerce-api/site/inbound-deliveries');
    return this.service.create(dto);
  }

  // Puts purchase order lines on an inbound delivery
  @Post(':id/lines')
  @RequirePermission(SITE_INBOUND_DELIVERIES.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddLines()
  addLines(@Param('id') id: string, @Body() dto: AddInboundDeliveryLinesDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/inbound-deliveries/${id}/lines`);
    return this.service.addLines(id, dto);
  }

  // Changes an inbound delivery's expected date, carrier, tracking number, supplier's delivery note or notes
  @Patch(':id')
  @RequirePermission(SITE_INBOUND_DELIVERIES.edit)
  @ApiUpdate()
  update(@Param('id') id: string, @Body() dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inbound-deliveries/${id}`);
    return this.service.update(id, dto);
  }

  // Changes the quantity of an inbound delivery line
  @Patch(':id/lines/:lineId')
  @RequirePermission(SITE_INBOUND_DELIVERIES.edit)
  @ApiUpdateLine()
  updateLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateInboundDeliveryLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inbound-deliveries/${id}/lines/${lineId}`);
    return this.service.updateLine(id, lineId, dto);
  }

  // Moves an inbound delivery to in transit, arrived or cancelled
  @Patch(':id/status')
  @RequirePermission(SITE_INBOUND_DELIVERIES.edit)
  @ApiSetStatus()
  setStatus(@Param('id') id: string, @Body() dto: SetInboundDeliveryStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inbound-deliveries/${id}/status`);
    return this.service.setStatus(id, dto);
  }

  // Returns one inbound delivery
  @Get(':id')
  @RequirePermission(SITE_INBOUND_DELIVERIES.view)
  @ApiFindById()
  findById(@Param('id') id: string): Promise<InboundDeliveryResponseDto> {
    this.logger.log(`GET /commerce-api/site/inbound-deliveries/${id}`);
    return this.service.findById(id);
  }

  // Returns the site's inbound deliveries for the data table
  @Get('table')
  @RequirePermission(SITE_INBOUND_DELIVERIES.view)
  @ApiFindForTable()
  findForTable(@UserId() userId: string): Promise<InboundDeliveryTableResponseDto> {
    this.logger.log('GET /commerce-api/site/inbound-deliveries/table');
    return this.service.findForTable(userId);
  }

  // Returns an inbound delivery's lines for the data table
  @Get(':id/lines/table')
  @RequirePermission(SITE_INBOUND_DELIVERIES.view)
  @ApiLinesTable()
  linesTable(@Param('id') id: string, @UserId() userId: string): Promise<InboundDeliveryLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inbound-deliveries/${id}/lines/table`);
    return this.service.findLinesTable(id, userId);
  }

  // Counts an inbound delivery's lines, one per tab of its detail page
  @Get(':id/counts')
  @RequirePermission(SITE_INBOUND_DELIVERIES.view)
  @ApiFindInboundDeliveryCounts()
  findCounts(@Param('id') id: string): Promise<InboundDeliveryCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/inbound-deliveries/${id}/counts`);
    return this.service.findCounts(id);
  }

  // Deletes a planned inbound delivery without lines
  @Delete(':id')
  @RequirePermission(SITE_INBOUND_DELIVERIES.delete)
  @ApiDelete()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/inbound-deliveries/${id}`);
    return this.service.delete(id);
  }

  // Removes a line from an inbound delivery
  @Delete(':id/lines/:lineId')
  @RequirePermission(SITE_INBOUND_DELIVERIES.edit)
  @ApiRemoveLine()
  removeLine(@Param('id') id: string, @Param('lineId') lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/inbound-deliveries/${id}/lines/${lineId}`);
    return this.service.removeLine(id, lineId);
  }
}
