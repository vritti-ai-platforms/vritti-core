import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { AddGoodsReceiptBatchDto } from './dto/request/add-goods-receipt-batch.dto';
import { AddGoodsReceiptBatchItemDto } from './dto/request/add-goods-receipt-batch-item.dto';
import { AddGoodsReceiptItemDto } from './dto/request/add-goods-receipt-item.dto';
import { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';
import { UpdateGoodsReceiptBatchDto } from './dto/request/update-goods-receipt-batch.dto';
import { UpdateGoodsReceiptBatchItemDto } from './dto/request/update-goods-receipt-batch-item.dto';
import { UpdateGoodsReceiptItemDto } from './dto/request/update-goods-receipt-item.dto';
import type { GoodsReceiptBatchItemResponseDto } from './dto/response/goods-receipt-batch-item-response.dto';
import type { GoodsReceiptBatchResponseDto } from './dto/response/goods-receipt-batch-response.dto';
import type { GoodsReceiptItemResponseDto } from './dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from './dto/response/goods-receipt-item-table-response.dto';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGoodsReceiptDto): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log('POST /commerce-api/goods-receipts');
    return this.service.create(dto);
  }

  @Get('table')
  findForTable(@UserId() userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log('GET /commerce-api/goods-receipts/table');
    return this.service.findForTable(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}`);
    return this.service.findById(id);
  }

  @Get(':id/items/inventory-item-ids')
  inventoryItemIds(@Param('id') goodsReceiptId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/inventory-item-ids`);
    return this.service.findInventoryItemIds(goodsReceiptId);
  }

  @Get(':id/items')
  items(@Param('id') goodsReceiptId: string): Promise<GoodsReceiptItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items`);
    return this.service.findItems(goodsReceiptId);
  }

  @Get(':id/items/table')
  itemsTable(@Param('id') goodsReceiptId: string, @UserId() userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/table`);
    return this.service.findItemsTable(goodsReceiptId, userId);
  }

  @Get(':id/items/:itemId')
  itemById(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<GoodsReceiptItemResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}`);
    return this.service.findItemById(goodsReceiptId, itemId);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @Param('id') goodsReceiptId: string,
    @Body() dto: AddGoodsReceiptItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items`);
    return this.service.addItem(goodsReceiptId, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGoodsReceiptItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}`);
    return this.service.updateItem(goodsReceiptId, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}`);
    return this.service.removeItem(goodsReceiptId, itemId);
  }

  @Get(':id/items/:itemId/batches')
  batches(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<GoodsReceiptBatchResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches`);
    return this.service.findBatches(goodsReceiptId, itemId);
  }

  @Get(':id/items/:itemId/batches/:batchId')
  batchById(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
  ): Promise<GoodsReceiptBatchResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}`);
    return this.service.findBatchById(goodsReceiptId, itemId, batchId);
  }

  @Post(':id/items/:itemId/batches')
  @HttpCode(HttpStatus.CREATED)
  addBatch(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddGoodsReceiptBatchDto,
  ): Promise<CreateResponseDto<GoodsReceiptBatchResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches`);
    return this.service.addBatch(goodsReceiptId, itemId, dto);
  }

  @Patch(':id/items/:itemId/batches/:batchId')
  updateBatch(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
    @Body() dto: UpdateGoodsReceiptBatchDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}`);
    return this.service.updateBatch(goodsReceiptId, itemId, batchId, dto);
  }

  @Delete(':id/items/:itemId/batches/:batchId')
  removeBatch(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}`);
    return this.service.removeBatch(goodsReceiptId, itemId, batchId);
  }

  @Get(':id/items/:itemId/batches/:batchId/items')
  batchItems(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
  ): Promise<GoodsReceiptBatchItemResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}/items`);
    return this.service.findBatchItems(goodsReceiptId, itemId, batchId);
  }

  @Post(':id/items/:itemId/batches/:batchId/items')
  @HttpCode(HttpStatus.CREATED)
  addBatchItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
    @Body() dto: AddGoodsReceiptBatchItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptBatchItemResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}/items`);
    return this.service.addBatchItem(goodsReceiptId, itemId, batchId, dto);
  }

  @Patch(':id/items/:itemId/batches/:batchId/items/:subItemId')
  updateBatchItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
    @Param('subItemId') subItemId: string,
    @Body() dto: UpdateGoodsReceiptBatchItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}/items/${subItemId}`);
    return this.service.updateBatchItem(goodsReceiptId, itemId, batchId, subItemId, dto);
  }

  @Delete(':id/items/:itemId/batches/:batchId/items/:subItemId')
  removeBatchItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('batchId') batchId: string,
    @Param('subItemId') subItemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/batches/${batchId}/items/${subItemId}`);
    return this.service.removeBatchItem(goodsReceiptId, itemId, batchId, subItemId);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/publish`);
    return this.service.publish(id);
  }

  @Post(':id/start-allocation')
  startAllocation(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/start-allocation`);
    return this.service.startAllocation(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${id}`);
    return this.service.delete(id);
  }
}
