import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { AddStockAdjustmentLineDto } from './dto/request/add-stock-adjustment-line.dto';
import { AddStockAdjustmentLineItemDto } from './dto/request/add-stock-adjustment-line-item.dto';
import { AddStockAdjustmentLotDto } from './dto/request/add-stock-adjustment-lot.dto';
import { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/request/update-stock-adjustment.dto';
import { UpdateStockAdjustmentLineDto } from './dto/request/update-stock-adjustment-line.dto';
import { UpdateStockAdjustmentLineItemDto } from './dto/request/update-stock-adjustment-line-item.dto';
import { UpdateStockAdjustmentLotDto } from './dto/request/update-stock-adjustment-lot.dto';
import type { StockAdjustmentLineItemResponseDto } from './dto/response/stock-adjustment-line-item-response.dto';
import type { StockAdjustmentLineItemTableResponseDto } from './dto/response/stock-adjustment-line-item-table-response.dto';
import type { StockAdjustmentLineResponseDto } from './dto/response/stock-adjustment-line-response.dto';
import type { StockAdjustmentLineTableResponseDto } from './dto/response/stock-adjustment-line-table-response.dto';
import type { StockAdjustmentLotDetailResponseDto } from './dto/response/stock-adjustment-lot-detail-response.dto';
import type { StockAdjustmentLotResponseDto } from './dto/response/stock-adjustment-lot-response.dto';
import type { StockAdjustmentResponseDto } from './dto/response/stock-adjustment-response.dto';
import type { StockAdjustmentTableResponseDto } from './dto/response/stock-adjustment-table-response.dto';
import type { StockAdjustmentTreeNodeResponseDto } from './dto/response/stock-adjustment-tree-response.dto';
import { StockAdjustmentsGatewayService } from './services/stock-adjustments-gateway.service';

@ApiTags('Commerce - Stock Adjustments')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('stock-adjustments')
export class StockAdjustmentsGatewayController {
  private readonly logger = new Logger(StockAdjustmentsGatewayController.name);

  constructor(private readonly service: StockAdjustmentsGatewayService) {}

  @Get('table')
  getStockAdjustmentTable(@UserId() userId: string): Promise<StockAdjustmentTableResponseDto> {
    this.logger.log('GET /commerce-api/stock-adjustments/table');
    return this.service.findForTable(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}`);
    return this.service.findById(id);
  }

  @Get(':id/lots')
  getLots(@Param('id') id: string): Promise<StockAdjustmentLotResponseDto[]> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lots`);
    return this.service.findLots(id);
  }

  @Get(':id/lots/:lotId/detail')
  getLotDetail(@Param('id') id: string, @Param('lotId') lotId: string): Promise<StockAdjustmentLotDetailResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lots/${lotId}/detail`);
    return this.service.findLotDetail(id, lotId);
  }

  @Post(':id/lots')
  @HttpCode(HttpStatus.CREATED)
  addLot(
    @Param('id') id: string,
    @Body() dto: AddStockAdjustmentLotDto,
  ): Promise<CreateResponseDto<StockAdjustmentLotResponseDto>> {
    this.logger.log(`POST /commerce-api/stock-adjustments/${id}/lots`);
    return this.service.addLot(id, dto);
  }

  @Patch(':id/lots/:lotId')
  updateLot(
    @Param('id') id: string,
    @Param('lotId') lotId: string,
    @Body() dto: UpdateStockAdjustmentLotDto,
  ): Promise<StockAdjustmentLotResponseDto> {
    this.logger.log(`PATCH /commerce-api/stock-adjustments/${id}/lots/${lotId}`);
    return this.service.updateLot(id, lotId, dto);
  }

  @Delete(':id/lots/:lotId')
  removeLot(@Param('id') id: string, @Param('lotId') lotId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/stock-adjustments/${id}/lots/${lotId}`);
    return this.service.removeLot(id, lotId);
  }

  @Get(':id/tree')
  getTree(@Param('id') id: string): Promise<StockAdjustmentTreeNodeResponseDto[]> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/tree`);
    return this.service.findTree(id);
  }

  @Get(':id/lines')
  getLines(@Param('id') id: string): Promise<StockAdjustmentLineResponseDto[]> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lines`);
    return this.service.findLines(id);
  }

  @Get(':id/lines/table')
  getLinesTable(@Param('id') id: string, @UserId() userId: string): Promise<StockAdjustmentLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lines/table`);
    return this.service.findLinesTable(id, userId);
  }

  @Get(':id/lots/:lotId/lines/table')
  getLinesByLotTable(
    @Param('id') id: string,
    @Param('lotId') lotId: string,
    @UserId() userId: string,
  ): Promise<StockAdjustmentLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lots/${lotId}/lines/table`);
    return this.service.findLinesByLotTable(id, lotId, userId);
  }

  @Get(':id/lines/:lineId')
  getLineById(@Param('id') id: string, @Param('lineId') lineId: string): Promise<StockAdjustmentLineResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lines/${lineId}`);
    return this.service.findLineById(id, lineId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStockAdjustmentDto): Promise<CreateResponseDto<StockAdjustmentResponseDto>> {
    this.logger.log('POST /commerce-api/stock-adjustments');
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStockAdjustmentDto): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`PATCH /commerce-api/stock-adjustments/${id}`);
    return this.service.update(id, dto);
  }

  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  addLine(
    @Param('id') id: string,
    @Body() dto: AddStockAdjustmentLineDto,
  ): Promise<CreateResponseDto<StockAdjustmentLineResponseDto>> {
    this.logger.log(`POST /commerce-api/stock-adjustments/${id}/lines`);
    return this.service.addLine(id, dto);
  }

  @Patch(':id/lines/:lineId')
  updateLine(@Param('id') id: string, @Param('lineId') lineId: string, @Body() dto: UpdateStockAdjustmentLineDto) {
    this.logger.log(`PATCH /commerce-api/stock-adjustments/${id}/lines/${lineId}`);
    return this.service.updateLine(id, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  removeLine(@Param('id') id: string, @Param('lineId') lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/stock-adjustments/${id}/lines/${lineId}`);
    return this.service.removeLine(id, lineId);
  }

  @Get(':id/lines/:lineId/items/table')
  getLineItemsTable(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @UserId() userId: string,
  ): Promise<StockAdjustmentLineItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lines/${lineId}/items/table`);
    return this.service.findLineItemsTable(id, lineId, userId);
  }

  @Post(':id/lines/:lineId/items')
  @HttpCode(HttpStatus.CREATED)
  addLineItem(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: AddStockAdjustmentLineItemDto,
  ): Promise<StockAdjustmentLineItemResponseDto> {
    this.logger.log(`POST /commerce-api/stock-adjustments/${id}/lines/${lineId}/items`);
    return this.service.addLineItem(id, lineId, dto);
  }

  @Patch(':id/lines/:lineId/items/:itemId')
  updateLineItem(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateStockAdjustmentLineItemDto,
  ): Promise<StockAdjustmentLineItemResponseDto> {
    this.logger.log(`PATCH /commerce-api/stock-adjustments/${id}/lines/${lineId}/items/${itemId}`);
    return this.service.updateLineItem(id, lineId, itemId, dto);
  }

  @Delete(':id/lines/:lineId/items/:itemId')
  removeLineItem(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Param('itemId') itemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/stock-adjustments/${id}/lines/${lineId}/items/${itemId}`);
    return this.service.removeLineItem(id, lineId, itemId);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string): Promise<StockAdjustmentResponseDto> {
    this.logger.log(`POST /commerce-api/stock-adjustments/${id}/publish`);
    return this.service.publish(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/stock-adjustments/${id}`);
    return this.service.delete(id);
  }
}
