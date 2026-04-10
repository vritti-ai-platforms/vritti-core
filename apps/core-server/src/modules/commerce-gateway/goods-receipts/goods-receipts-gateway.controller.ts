import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';
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
  create(@Body() dto: CreateGoodsReceiptDto): Promise<unknown> {
    return this.service.create(dto);
  }

  // Returns goods receipts for a purchase order
  @Get('by-po/:poId')
  findByPoId(@Param('poId') poId: string): Promise<unknown> {
    return this.service.findByPoId(poId);
  }
}
