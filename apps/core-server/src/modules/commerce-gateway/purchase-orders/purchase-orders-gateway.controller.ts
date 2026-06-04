import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SessionTypeValues } from '@/db/schema';
import type { GoodsReceiptTableResponseDto } from '@/modules/commerce-gateway/goods-receipts/dto/response/goods-receipt-table-response.dto';
import { AddPurchaseOrderItemDto } from './dto/request/add-purchase-order-item.dto';
import { ChangePurchaseOrderExchangeRateDto } from './dto/request/change-purchase-order-exchange-rate.dto';
import { ChangePurchaseOrderSupplierDto } from './dto/request/change-purchase-order-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/request/create-purchase-order.dto';
import { PurchaseOrderSelectQueryDto } from './dto/request/purchase-order-select-query.dto';
import { SendPurchaseOrderEmailDto } from './dto/request/send-purchase-order-email.dto';
import { UpdatePurchaseOrderItemDto } from './dto/request/update-purchase-order-item.dto';
import { UpdatePurchaseOrderNotesDto } from './dto/request/update-purchase-order-notes.dto';
import type { PurchaseOrderItemTableResponseDto } from './dto/response/purchase-order-item-table-response.dto';
import type { PurchaseOrderResponseDto } from './dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from './dto/response/purchase-order-table-response.dto';
import { PurchaseOrdersGatewayService } from './services/purchase-orders-gateway.service';

@ApiTags('Commerce - Purchase Orders')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('purchase-orders')
export class PurchaseOrdersGatewayController {
  private readonly logger = new Logger(PurchaseOrdersGatewayController.name);

  constructor(private readonly service: PurchaseOrdersGatewayService) {}

  // Returns paginated purchase orders for the data table
  @Get('table')
  getTable(@UserId() userId: string): Promise<PurchaseOrderTableResponseDto> {
    this.logger.log('GET /commerce-api/purchase-orders/table');
    return this.service.findForTable(userId);
  }

  // Returns purchase order options for select dropdowns
  @Get('select')
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  select(@Query() query: PurchaseOrderSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/purchase-orders/select');
    return this.service.select(query);
  }

  // Creates a new purchase order
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePurchaseOrderDto): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log('POST /commerce-api/purchase-orders');
    return this.service.create(dto);
  }

  // Generates and streams a purchase order PDF
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    this.logger.log(`GET /purchase-orders/${id}/pdf`);
    const { buffer, filename } = await this.service.downloadPdf(id, req.sessionInfo?.buId ?? '');
    void reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename="${filename}"`)
      .send(buffer);
  }

  // Returns a single purchase order by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}`);
    return this.service.findById(id);
  }

  // Returns inventory item IDs for a purchase order
  @Get(':id/items/ids')
  findItemIds(@Param('id') id: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/items/ids`);
    return this.service.findItemIds(id);
  }

  // Returns line items table for a purchase order
  @Get(':id/items/table')
  findItemsTable(@Param('id') id: string, @UserId() userId: string): Promise<PurchaseOrderItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/items/table`);
    return this.service.findItemsTable(id, userId);
  }

  @Get(':id/goods-receipts/table')
  findGoodsReceiptTable(@Param('id') id: string, @UserId() userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log(`GET /commerce-api/purchase-orders/${id}/goods-receipts/table`);
    return this.service.findGoodsReceiptTable(id, userId);
  }

  // Adds a line item to a purchase order
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @Param('id') id: string,
    @Body() dto: AddPurchaseOrderItemDto,
  ): Promise<CreateResponseDto<PurchaseOrderResponseDto>> {
    this.logger.log(`POST /commerce-api/purchase-orders/${id}/items`);
    return this.service.addItem(id, dto);
  }

  // Updates a line item on a purchase order
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/items/${itemId}`);
    return this.service.updateItem(id, itemId, dto);
  }

  // Removes a line item from a purchase order
  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/purchase-orders/${id}/items/${itemId}`);
    return this.service.removeItem(id, itemId);
  }

  // Updates purchase order notes
  @Patch(':id/notes')
  updateNotes(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/notes`);
    return this.service.updateNotes(id, dto);
  }

  // Changes purchase order supplier
  @Patch(':id/supplier')
  changeSupplier(@Param('id') id: string, @Body() dto: ChangePurchaseOrderSupplierDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/supplier`);
    return this.service.changeSupplier(id, dto);
  }

  // Changes purchase order exchange rate policy / value (pre-receipt only, cross-currency only)
  @Patch(':id/exchange-rate')
  changeExchangeRate(
    @Param('id') id: string,
    @Body() dto: ChangePurchaseOrderExchangeRateDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/exchange-rate`);
    return this.service.changeExchangeRate(id, dto);
  }

  // Closes a purchase order short — no further receipts expected
  @Patch(':id/close')
  closePurchaseOrder(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/close`);
    return this.service.closePurchaseOrder(id);
  }

  // Updates the status of a purchase order
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/purchase-orders/${id}/status`);
    return this.service.updateStatus(id, status);
  }

  // Sends the purchase order email with PDF attachment
  @Post(':id/send-email')
  @HttpCode(HttpStatus.OK)
  sendEmail(@Param('id') id: string, @Body() dto: SendPurchaseOrderEmailDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/purchase-orders/${id}/send-email`);
    return this.service.sendEmail(id, dto);
  }

  // Deletes a purchase order by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/purchase-orders/${id}`);
    return this.service.delete(id);
  }
}
