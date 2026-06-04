import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateStockTransferDto } from './dto/request/create-stock-transfer.dto';
import { UpdateStockTransferStatusDto } from './dto/request/update-stock-transfer-status.dto';
import type { StockTransferResponseDto } from './dto/response/stock-transfer-response.dto';
import type { StockTransferTableResponseDto } from './dto/response/stock-transfer-table-response.dto';
import { StockTransfersGatewayService } from './services/stock-transfers-gateway.service';

@ApiTags('Commerce - Stock Transfers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('stock-transfers')
export class StockTransfersGatewayController {
  private readonly logger = new Logger(StockTransfersGatewayController.name);

  constructor(private readonly service: StockTransfersGatewayService) {}

  // Returns paginated stock transfers for the data table with server-stored state
  @Get('table')
  getStockTransferTable(@UserId() userId: string): Promise<StockTransferTableResponseDto> {
    return this.service.findForTable(userId);
  }

  // Creates a new stock transfer
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStockTransferDto): Promise<StockTransferResponseDto> {
    return this.service.create(dto);
  }

  // Updates the status of a stock transfer
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStockTransferStatusDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.service.updateStatus(id, dto);
  }
}
