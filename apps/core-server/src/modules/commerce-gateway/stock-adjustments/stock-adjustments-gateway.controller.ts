import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { AddStockAdjustmentLineDto } from './dto/request/add-stock-adjustment-line.dto';
import { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';
import { UpdateStockAdjustmentLineDto } from './dto/request/update-stock-adjustment-line.dto';
import type { StockAdjustmentResponseDto } from './dto/response/stock-adjustment-response.dto';
import type { StockAdjustmentTableResponseDto } from './dto/response/stock-adjustment-table-response.dto';
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

  @Get(':id/lines/table')
  getLinesTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/stock-adjustments/${id}/lines/table`);
    return this.service.findLinesTable(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStockAdjustmentDto): Promise<StockAdjustmentResponseDto> {
    this.logger.log('POST /commerce-api/stock-adjustments');
    return this.service.create(dto);
  }

  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  addLine(@Param('id') id: string, @Body() dto: AddStockAdjustmentLineDto) {
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
