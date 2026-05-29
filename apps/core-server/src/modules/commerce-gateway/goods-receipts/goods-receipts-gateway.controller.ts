import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  AddGoodsReceiptItemFromPurchaseOrderItemDto,
  AddGoodsReceiptItemFromSupplierItemDto,
} from './dto/request/add-goods-receipt-item.dto';
import { AddGoodsReceiptLineDto } from './dto/request/add-goods-receipt-line.dto';
import { AddGoodsReceiptLineItemDto } from './dto/request/add-goods-receipt-line-item.dto';
import { AddGoodsReceiptLotDto } from './dto/request/add-goods-receipt-lot.dto';
import { AssociateGoodsReceiptCostDto } from './dto/request/associate-cost.dto';
import { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';
import { LinkGoodsReceiptPurchaseOrderDto } from './dto/request/link-goods-receipt-purchase-order.dto';
import { UpdateGoodsReceiptCostDto } from './dto/request/update-cost.dto';
import { UpdateGoodsReceiptItemDto } from './dto/request/update-goods-receipt-item.dto';
import { UpdateGoodsReceiptLineDto } from './dto/request/update-goods-receipt-line.dto';
import { UpdateGoodsReceiptLotDto } from './dto/request/update-goods-receipt-lot.dto';
import type {
  CostAllocationResponseDto,
  GoodsReceiptCostResponseDto,
  GoodsReceiptCostsResponseDto,
} from './dto/response/cost-response.dto';
import type { GoodsReceiptItemResponseDto } from './dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from './dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptLineItemResponseDto } from './dto/response/goods-receipt-line-item-response.dto';
import type { GoodsReceiptLineItemTableResponseDto } from './dto/response/goods-receipt-line-item-table-response.dto';
import type { GoodsReceiptLineResponseDto } from './dto/response/goods-receipt-line-response.dto';
import type { GoodsReceiptLineTableResponseDto } from './dto/response/goods-receipt-line-table-response.dto';
import type { GoodsReceiptLotResponseDto } from './dto/response/goods-receipt-lot-response.dto';
import type { GoodsReceiptResponseDto } from './dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from './dto/response/goods-receipt-table-response.dto';
import type { GoodsReceiptTreeNodeResponseDto } from './dto/response/goods-receipt-tree-response.dto';
import { GoodsReceiptsGatewayService } from './services/goods-receipts-gateway.service';

@ApiTags('Commerce - Goods Receipts')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('goods-receipts')
export class GoodsReceiptsGatewayController {
  private readonly logger = new Logger(GoodsReceiptsGatewayController.name);

  constructor(private readonly service: GoodsReceiptsGatewayService) {}

  // Header

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

  @Get(':id/tree')
  tree(@Param('id') id: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}/tree`);
    return this.service.findTree(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/publish`);
    return this.service.publish(id);
  }

  @Post(':id/link-po')
  linkPurchaseOrder(
    @Param('id') id: string,
    @Body() dto: LinkGoodsReceiptPurchaseOrderDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/link-po`);
    return this.service.linkPurchaseOrder(id, dto.purchaseOrderId);
  }

  @Post(':id/unlink-po')
  unlinkPurchaseOrder(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/unlink-po`);
    return this.service.unlinkPurchaseOrder(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${id}`);
    return this.service.delete(id);
  }

  // Costs (Hybrid PR5)

  @Get(':id/costs')
  getCosts(@Param('id') id: string, @UserId() userId: string): Promise<GoodsReceiptCostsResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}/costs`);
    return this.service.findCostsForTable(id, userId);
  }

  @Get(':id/costs/:costId/allocations')
  getCostAllocations(@Param('costId') costId: string): Promise<CostAllocationResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/.../costs/${costId}/allocations`);
    return this.service.findCostAllocations(costId);
  }

  @Post(':id/associate-cost')
  @HttpCode(HttpStatus.CREATED)
  associateCost(
    @Param('id') id: string,
    @Body() dto: AssociateGoodsReceiptCostDto,
    @UserId() userId: string,
  ): Promise<GoodsReceiptCostResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/associate-cost`);
    return this.service.associateCost(id, dto, userId);
  }

  @Patch(':id/costs/:costId')
  updateCost(
    @Param('costId') costId: string,
    @Body() dto: UpdateGoodsReceiptCostDto,
  ): Promise<GoodsReceiptCostResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/.../costs/${costId}`);
    return this.service.updateCost(costId, dto);
  }

  @Delete(':id/costs/:costId')
  deleteCost(@Param('costId') costId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/.../costs/${costId}`);
    return this.service.deleteCost(costId);
  }

  // Items

  @Get(':id/items/inventory-item-ids')
  inventoryItemIds(@Param('id') goodsReceiptId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/inventory-item-ids`);
    return this.service.findInventoryItemIds(goodsReceiptId);
  }

  @Get(':id/items/table')
  itemsTable(@Param('id') goodsReceiptId: string, @UserId() userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/table`);
    return this.service.findItemsTable(goodsReceiptId, userId);
  }

  @Post(':id/items/from-supplier-item')
  @HttpCode(HttpStatus.CREATED)
  addItemFromSupplierItem(
    @Param('id') goodsReceiptId: string,
    @Body() dto: AddGoodsReceiptItemFromSupplierItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/from-supplier-item`);
    return this.service.addItemFromSupplierItem(goodsReceiptId, dto);
  }

  @Post(':id/items/from-purchase-order-item')
  @HttpCode(HttpStatus.CREATED)
  addItemFromPurchaseOrderItem(
    @Param('id') goodsReceiptId: string,
    @Body() dto: AddGoodsReceiptItemFromPurchaseOrderItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptItemResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/from-purchase-order-item`);
    return this.service.addItemFromPurchaseOrderItem(goodsReceiptId, dto);
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

  // Lots

  @Get(':id/items/:itemId/lots')
  lots(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<GoodsReceiptLotResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots`);
    return this.service.findLots(goodsReceiptId, itemId);
  }

  @Post(':id/items/:itemId/lots')
  @HttpCode(HttpStatus.CREATED)
  addLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddGoodsReceiptLotDto,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots`);
    return this.service.addLot(goodsReceiptId, itemId, dto);
  }

  @Patch(':id/items/:itemId/lots/:lotId')
  updateLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
    @Body() dto: UpdateGoodsReceiptLotDto,
  ): Promise<GoodsReceiptLotResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}`);
    return this.service.updateLot(goodsReceiptId, itemId, lotId, dto);
  }

  @Delete(':id/items/:itemId/lots/:lotId')
  removeLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}`);
    return this.service.removeLot(goodsReceiptId, itemId, lotId);
  }

  // Lines

  @Get(':id/items/:itemId/lines/table')
  linesTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/table`);
    return this.service.findLinesTable(goodsReceiptId, itemId, userId);
  }

  @Get(':id/items/:itemId/lots/:lotId/lines/table')
  linesByLotTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}/lines/table`);
    return this.service.findLinesByLotTable(goodsReceiptId, itemId, lotId, userId);
  }

  @Get(':id/items/:itemId/lines/:lineId')
  lineById(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
  ): Promise<GoodsReceiptLineResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.findLineById(goodsReceiptId, itemId, lineId);
  }

  @Post(':id/items/:itemId/lines')
  @HttpCode(HttpStatus.CREATED)
  addLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines`);
    return this.service.addLine(goodsReceiptId, itemId, dto);
  }

  @Patch(':id/items/:itemId/lines/:lineId')
  updateLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateGoodsReceiptLineDto,
  ): Promise<GoodsReceiptLineResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.updateLine(goodsReceiptId, itemId, lineId, dto);
  }

  @Delete(':id/items/:itemId/lines/:lineId')
  removeLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.removeLine(goodsReceiptId, itemId, lineId);
  }

  // Line items (serials)

  @Get(':id/items/:itemId/lines/:lineId/items/table')
  lineItemsTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}/items/table`);
    return this.service.findLineItemsTable(goodsReceiptId, itemId, lineId, userId);
  }

  @Post(':id/items/:itemId/lines/:lineId/items')
  @HttpCode(HttpStatus.CREATED)
  addLineItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @Body() dto: AddGoodsReceiptLineItemDto,
  ): Promise<GoodsReceiptLineItemResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}/items`);
    return this.service.addLineItem(goodsReceiptId, itemId, lineId, dto);
  }

  @Delete(':id/items/:itemId/lines/:lineId/items/:subItemId')
  removeLineItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @Param('subItemId') subItemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}/items/${subItemId}`,
    );
    return this.service.removeLineItem(goodsReceiptId, itemId, lineId, subItemId);
  }
}
