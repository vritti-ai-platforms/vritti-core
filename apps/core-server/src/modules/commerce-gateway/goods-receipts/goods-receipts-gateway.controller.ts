import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';
import type { GoodsReceiptResponseDto } from './dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from './dto/response/goods-receipt-table-response.dto';
import { GoodsReceiptsGatewayService } from './services/goods-receipts-gateway.service';

@ApiTags('Commerce - Goods Receipts')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('goods-receipts')
export class GoodsReceiptsGatewayController {
  private readonly logger = new Logger(GoodsReceiptsGatewayController.name);

  constructor(private readonly service: GoodsReceiptsGatewayService) {}

  // Creates a new goods receipt
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGoodsReceiptDto): Promise<GoodsReceiptResponseDto> {
    return this.service.create(dto);
  }

  // Returns paginated goods receipts table
  @Get('table')
  findForTable(@UserId() userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log('GET /commerce-api/goods-receipts/table');
    return this.service.findForTable(userId);
  }

  // Returns goods receipts for a purchase order
  @Get('by-po/:poId')
  findByPoId(@Param('poId') poId: string): Promise<GoodsReceiptResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/by-po/${poId}`);
    return this.service.findByPoId(poId);
  }

  // Returns goods receipt detail by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}`);
    return this.service.findById(id);
  }
}
