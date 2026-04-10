import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateStockAdjustmentDto } from './dto/request/create-stock-adjustment.dto';
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

  // Returns paginated stock adjustments for the data table with server-stored state
  @Get('table')
  getStockAdjustmentTable(@UserId() userId: string): Promise<StockAdjustmentTableResponseDto> {
    return this.service.findForTable(userId);
  }

  // Creates a new stock adjustment
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStockAdjustmentDto): Promise<StockAdjustmentResponseDto> {
    return this.service.create(dto);
  }
}
