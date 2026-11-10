import { AddGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line.dto';
import { AddGoodsReceiptLineItemDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line-item.dto';
import { AddGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-lot.dto';
import { AddGoodsReceiptPurchaseOrderDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { CreateGoodsReceiptFromPurchaseOrdersDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
import { UpdateGoodsReceiptDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt.dto';
import { UpdateGoodsReceiptItemDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-item.dto';
import { UpdateGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-line.dto';
import { UpdateGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-lot.dto';
import type { GoodsReceiptItemQuantsResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-quants-response.dto';
import type { GoodsReceiptItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-response.dto';
import type { GoodsReceiptItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-table-response.dto';
import type { GoodsReceiptItemsCostResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-items-cost-response.dto';
import type { GoodsReceiptLineItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-response.dto';
import type { GoodsReceiptLineItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-table-response.dto';
import type { GoodsReceiptLineResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-response.dto';
import type { GoodsReceiptLineTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-table-response.dto';
import type { GoodsReceiptLotResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-lot-response.dto';
import type { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import type { GoodsReceiptTreeNodeResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-tree-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_GOODS_RECEIPTS } from '@vritti/commerce-permissions/goods-receipts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiAddLine,
  ApiAddLineItem,
  ApiAddLot,
  ApiAddPurchaseOrder,
  ApiCreateFromDelivery,
  ApiCreateFromPurchaseOrders,
  ApiDelete,
  ApiFindById,
  ApiFindForTable,
  ApiInventoryItemIds,
  ApiItemDetail,
  ApiItemQuants,
  ApiItemsCost,
  ApiItemsTable,
  ApiLineById,
  ApiLineItemsTable,
  ApiLinesByLotTable,
  ApiLinesTable,
  ApiLots,
  ApiPublish,
  ApiRemoveItem,
  ApiRemoveLine,
  ApiRemoveLineItem,
  ApiRemoveLot,
  ApiTree,
  ApiUpdate,
  ApiUpdateItem,
  ApiUpdateLine,
  ApiUpdateLot,
} from './docs/goods-receipts-gateway.docs';
import { GoodsReceiptsGatewayService } from './services/goods-receipts-gateway.service';

@ApiTags('Commerce - Goods Receipts')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_GOODS_RECEIPTS.featureCode)
@Controller('goods-receipts')
export class GoodsReceiptsGatewayController {
  private readonly logger = new Logger(GoodsReceiptsGatewayController.name);

  constructor(private readonly service: GoodsReceiptsGatewayService) {}

  // Creates a draft goods receipt of an announced inbound delivery, pre-filled with its open lines
  @Post('from-delivery')
  @RequirePermission(SITE_GOODS_RECEIPTS.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateFromDelivery()
  createFromDelivery(
    @Body() dto: CreateGoodsReceiptFromDeliveryDto,
  ): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log('POST /commerce-api/goods-receipts/from-delivery');
    return this.service.createFromDelivery(dto);
  }

  // Creates an arrived inbound delivery of a supplier's purchase orders and a draft goods receipt of it
  @Post('from-purchase-orders')
  @RequirePermission(SITE_GOODS_RECEIPTS.add)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateFromPurchaseOrders()
  createFromPurchaseOrders(
    @Body() dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptResponseDto>> {
    this.logger.log('POST /commerce-api/goods-receipts/from-purchase-orders');
    return this.service.createFromPurchaseOrders(dto);
  }

  // Adds the open lines of another purchase order of the supplier to a draft goods receipt and its inbound delivery
  @Post(':id/purchase-orders')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiAddPurchaseOrder()
  addPurchaseOrder(
    @Param('id') goodsReceiptId: string,
    @Body() dto: AddGoodsReceiptPurchaseOrderDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/purchase-orders`);
    return this.service.addPurchaseOrder(goodsReceiptId, dto);
  }

  // Returns the site's goods receipts for the data table
  @Get('table')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiFindForTable()
  findForTable(@UserId() userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log('GET /commerce-api/goods-receipts/table');
    return this.service.findForTable(userId);
  }

  // Returns one goods receipt
  @Get(':id')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiFindById()
  findById(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}`);
    return this.service.findById(id);
  }

  // Changes a draft goods receipt's notes and the supplier's delivery note on the inbound delivery it created
  @Patch(':id')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiUpdate()
  update(@Param('id') id: string, @Body() dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${id}`);
    return this.service.update(id, dto);
  }

  // Returns a goods receipt's items with their lots and lines as a tree
  @Get(':id/tree')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiTree()
  tree(@Param('id') id: string): Promise<GoodsReceiptTreeNodeResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${id}/tree`);
    return this.service.findTree(id);
  }

  // Publishes a goods receipt, landing its stock at the site
  @Post(':id/publish')
  @RequirePermission(SITE_GOODS_RECEIPTS.publish)
  @ApiPublish()
  publish(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`POST /commerce-api/goods-receipts/${id}/publish`);
    return this.service.publish(id);
  }

  // Deletes a draft goods receipt
  @Delete(':id')
  @RequirePermission(SITE_GOODS_RECEIPTS.delete)
  @ApiDelete()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${id}`);
    return this.service.delete(id);
  }

  // Returns the inventory items counted on a goods receipt
  @Get(':id/items/inventory-item-ids')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiInventoryItemIds()
  inventoryItemIds(@Param('id') goodsReceiptId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/inventory-item-ids`);
    return this.service.findInventoryItemIds(goodsReceiptId);
  }

  // Returns a goods receipt's items for the data table
  @Get(':id/items/table')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiItemsTable()
  itemsTable(@Param('id') goodsReceiptId: string, @UserId() userId: string): Promise<GoodsReceiptItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/table`);
    return this.service.findItemsTable(goodsReceiptId, userId);
  }

  // Returns the provisional cost of a goods receipt's items
  @Get(':id/items/cost')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiItemsCost()
  itemsCost(@Param('id') goodsReceiptId: string): Promise<GoodsReceiptItemsCostResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/cost`);
    return this.service.findItemsCost(goodsReceiptId);
  }

  // Returns the quants a published goods receipt item landed in
  @Get(':id/items/:itemId/quants')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiItemQuants()
  itemQuants(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
  ): Promise<GoodsReceiptItemQuantsResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/quants`);
    return this.service.findItemQuants(goodsReceiptId, itemId);
  }

  // Returns one item of a goods receipt with its purchase order context and flags
  @Get(':id/items/:itemId/detail')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiItemDetail()
  itemDetail(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
  ): Promise<GoodsReceiptItemResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/detail`);
    return this.service.findItemById(goodsReceiptId, itemId);
  }

  // Changes the received or rejected quantity of a goods receipt item
  @Patch(':id/items/:itemId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiUpdateItem()
  updateItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGoodsReceiptItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}`);
    return this.service.updateItem(goodsReceiptId, itemId, dto);
  }

  // Removes an item from a goods receipt
  @Delete(':id/items/:itemId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiRemoveItem()
  removeItem(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}`);
    return this.service.removeItem(goodsReceiptId, itemId);
  }

  // Returns the lots of a goods receipt item
  @Get(':id/items/:itemId/lots')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiLots()
  lots(@Param('id') goodsReceiptId: string, @Param('itemId') itemId: string): Promise<GoodsReceiptLotResponseDto[]> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots`);
    return this.service.findLots(goodsReceiptId, itemId);
  }

  // Adds a lot to a goods receipt item
  @Post(':id/items/:itemId/lots')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddLot()
  addLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddGoodsReceiptLotDto,
  ): Promise<CreateResponseDto<GoodsReceiptLotResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots`);
    return this.service.addLot(goodsReceiptId, itemId, dto);
  }

  // Changes a lot of a goods receipt item
  @Patch(':id/items/:itemId/lots/:lotId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiUpdateLot()
  updateLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
    @Body() dto: UpdateGoodsReceiptLotDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}`);
    return this.service.updateLot(goodsReceiptId, itemId, lotId, dto);
  }

  // Removes a lot from a goods receipt item
  @Delete(':id/items/:itemId/lots/:lotId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiRemoveLot()
  removeLot(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}`);
    return this.service.removeLot(goodsReceiptId, itemId, lotId);
  }

  // Returns a goods receipt item's lines for the data table
  @Get(':id/items/:itemId/lines/table')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiLinesTable()
  linesTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/table`);
    return this.service.findLinesTable(goodsReceiptId, itemId, userId);
  }

  // Returns the lines one lot of a goods receipt item is distributed to, for the data table
  @Get(':id/items/:itemId/lots/:lotId/lines/table')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiLinesByLotTable()
  linesByLotTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lotId') lotId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lots/${lotId}/lines/table`);
    return this.service.findLinesByLotTable(goodsReceiptId, itemId, lotId, userId);
  }

  // Returns one line of a goods receipt item
  @Get(':id/items/:itemId/lines/:lineId')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiLineById()
  lineById(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
  ): Promise<GoodsReceiptLineResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.findLineById(goodsReceiptId, itemId, lineId);
  }

  // Adds a line to a goods receipt item
  @Post(':id/items/:itemId/lines')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddLine()
  addLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddGoodsReceiptLineDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines`);
    return this.service.addLine(goodsReceiptId, itemId, dto);
  }

  // Changes a line of a goods receipt item
  @Patch(':id/items/:itemId/lines/:lineId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiUpdateLine()
  updateLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateGoodsReceiptLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.updateLine(goodsReceiptId, itemId, lineId, dto);
  }

  // Removes a line from a goods receipt item
  @Delete(':id/items/:itemId/lines/:lineId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiRemoveLine()
  removeLine(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}`);
    return this.service.removeLine(goodsReceiptId, itemId, lineId);
  }

  // Returns the serials registered on a goods receipt line, for the data table
  @Get(':id/items/:itemId/lines/:lineId/items/table')
  @RequirePermission(SITE_GOODS_RECEIPTS.view)
  @ApiLineItemsTable()
  lineItemsTable(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @UserId() userId: string,
  ): Promise<GoodsReceiptLineItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}/items/table`);
    return this.service.findLineItemsTable(goodsReceiptId, itemId, lineId, userId);
  }

  // Registers a serial on a goods receipt line
  @Post(':id/items/:itemId/lines/:lineId/items')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiAddLineItem()
  addLineItem(
    @Param('id') goodsReceiptId: string,
    @Param('itemId') itemId: string,
    @Param('lineId') lineId: string,
    @Body() dto: AddGoodsReceiptLineItemDto,
  ): Promise<CreateResponseDto<GoodsReceiptLineItemResponseDto>> {
    this.logger.log(`POST /commerce-api/goods-receipts/${goodsReceiptId}/items/${itemId}/lines/${lineId}/items`);
    return this.service.addLineItem(goodsReceiptId, itemId, lineId, dto);
  }

  // Removes a serial from a goods receipt line
  @Delete(':id/items/:itemId/lines/:lineId/items/:subItemId')
  @RequirePermission(SITE_GOODS_RECEIPTS.edit)
  @ApiRemoveLineItem()
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
