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
import { GoodsReceiptItemQuantsResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-quants-response.dto';
import { GoodsReceiptItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-response.dto';
import { GoodsReceiptItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-item-table-response.dto';
import { GoodsReceiptItemsCostResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-items-cost-response.dto';
import { GoodsReceiptLineItemResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-response.dto';
import { GoodsReceiptLineItemTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-item-table-response.dto';
import { GoodsReceiptLineResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-response.dto';
import { GoodsReceiptLineTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-line-table-response.dto';
import { GoodsReceiptLotResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-lot-response.dto';
import { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import { GoodsReceiptTableResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-table-response.dto';
import { GoodsReceiptTreeNodeResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-tree-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiCreateFromDelivery() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a goods receipt from an inbound delivery',
      description:
        "Creates a draft receipt of an announced inbound delivery at the site — not received or cancelled and without a draft receipt — pre-filled with each delivery line's open quantity (delivery quantity less what is already received against it). The receipt carries only those lines.",
    }),
    ApiBody({ type: CreateGoodsReceiptFromDeliveryDto }),
    ApiResponse({ status: 201, description: 'Goods receipt created.', type: GoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The delivery is received, cancelled or created by a goods receipt, nothing is left to receive on it, or the supplier is blocked at the site.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
    ApiResponse({ status: 409, description: 'A draft goods receipt of the delivery is already open.' }),
  );
}

export function ApiCreateFromPurchaseOrders() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a goods receipt from purchase orders',
      description:
        "For goods that arrived without an announced delivery: in one transaction, creates an ARRIVED inbound delivery (source RECEIPT, expected on the received date) and a draft receipt of it, both carrying every open line of the supplier's selected confirmed or partially received purchase orders at their open quantity (ordered and free, less received, less what open deliveries still expect).",
    }),
    ApiBody({ type: CreateGoodsReceiptFromPurchaseOrdersDto }),
    ApiResponse({ status: 201, description: 'Goods receipt created.', type: GoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'A purchase order is of another supplier or site, not open for receiving or has nothing left outside open deliveries, or the supplier is blocked at the site.',
    }),
    ApiResponse({ status: 404, description: 'A purchase order was not found.' }),
    ApiResponse({
      status: 409,
      description: "The supplier's delivery note number is already on another non-cancelled delivery of the supplier.",
    }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a goods receipt',
      description:
        "Changes a draft receipt's notes and, when the receipt created its inbound delivery (source RECEIPT), the supplier's delivery note (challan) number and date on that delivery, in one transaction. An announced delivery's note is edited on the delivery.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiBody({ type: UpdateGoodsReceiptDto }),
    ApiResponse({ status: 200, description: 'Goods receipt updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The receipt is published, or it receives an announced delivery and a delivery note field was sent.',
    }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
    ApiResponse({
      status: 409,
      description: "The supplier's delivery note number is already on another non-cancelled delivery of the supplier.",
    }),
  );
}

export function ApiFindForTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List goods receipts',
      description: "Returns a page of the site's goods receipts using the user's saved table state.",
    }),
    ApiResponse({ status: 200, description: 'Goods receipts retrieved.', type: GoodsReceiptTableResponseDto }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a goods receipt',
      description:
        'Returns the receipt with its supplier, inbound delivery, purchase order numbers and whether it is ready to publish.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Goods receipt retrieved.', type: GoodsReceiptResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
  );
}

export function ApiTree() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the item tree of a goods receipt',
      description: 'Returns the items with their lots and lines below them, each with its distribution progress.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Tree retrieved.', type: GoodsReceiptTreeNodeResponseDto }),
  );
}

export function ApiPublish() {
  return applyDecorators(
    ApiOperation({
      summary: 'Publish a goods receipt',
      description:
        "Lands the accepted stock at the receipt's site valued provisionally from the purchase order lines, and moves the received quantities of its purchase order lines and the status of every order it counts. Over-receipt and short expiry are only flagged.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 201, description: 'Goods receipt published.', type: GoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The receipt is already published or not every item is fully distributed.',
    }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a goods receipt',
      description:
        'Deletes a draft receipt with everything counted on it and, when the receipt created its inbound delivery (source RECEIPT), that delivery too. An announced delivery is never deleted.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Goods receipt deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is published.' }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
  );
}

export function ApiInventoryItemIds() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the inventory items on a goods receipt',
      description: 'Returns the ids of the inventory items counted on the receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Inventory item ids retrieved.', type: [String] }),
  );
}

export function ApiItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the items of a goods receipt',
      description:
        "Returns a page of the receipt's items with their purchase order context and flags, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Goods receipt items retrieved.', type: GoodsReceiptItemTableResponseDto }),
  );
}

export function ApiItemsCost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the provisional cost of a goods receipt',
      description:
        "Returns each item's cost per primary unit and value in the legal entity's currency, from its purchase order line; read-only until a supplier invoice sets the final cost.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Provisional cost retrieved.', type: GoodsReceiptItemsCostResponseDto }),
  );
}

export function ApiItemQuants() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the quants of a goods receipt item',
      description: 'Returns the quants a published receipt item landed in, with their cost.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Quants retrieved.', type: GoodsReceiptItemQuantsResponseDto }),
  );
}

export function ApiAddPurchaseOrder() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a purchase order to a goods receipt',
      description:
        "Adds every open line of another confirmed or partially received purchase order of the receipt's supplier at its site to a draft receipt and, in the same transaction, to the inbound delivery the receipt created. Not offered for receipts of an announced delivery.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiBody({ type: AddGoodsReceiptPurchaseOrderDto }),
    ApiResponse({ status: 201, description: 'Purchase order lines added.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The receipt is published or receives an announced delivery, or the order is of another supplier or site, not open, already on the receipt or has nothing left.',
    }),
    ApiResponse({ status: 404, description: 'Goods receipt or purchase order not found.' }),
  );
}

export function ApiItemDetail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a goods receipt item',
      description: 'Returns the item with its purchase order context, distribution progress and flags.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Goods receipt item retrieved.', type: GoodsReceiptItemResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt item not found.' }),
  );
}

export function ApiUpdateItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a goods receipt item',
      description: 'Changes the received or rejected quantity of an item on a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiBody({ type: UpdateGoodsReceiptItemDto }),
    ApiResponse({ status: 200, description: 'Item updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is published or more is rejected than received.' }),
    ApiResponse({ status: 404, description: 'Goods receipt item not found.' }),
  );
}

export function ApiRemoveItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a goods receipt item',
      description: 'Removes an item, with its lots and lines, from a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Item removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is published.' }),
    ApiResponse({ status: 404, description: 'Goods receipt item not found.' }),
  );
}

export function ApiLots() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the lots of a goods receipt item',
      description: "Returns the item's lots with how much their lines hold.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Lots retrieved.', type: [GoodsReceiptLotResponseDto] }),
  );
}

export function ApiAddLot() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a lot to a goods receipt item',
      description: 'Adds a lot with its dates and printed MRP to a lot-tracked item of a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiBody({ type: AddGoodsReceiptLotDto }),
    ApiResponse({ status: 201, description: 'Lot added.', type: GoodsReceiptLotResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The receipt is published, the item is not lot-tracked or the MRP is not in the legal entity's currency.",
    }),
    ApiResponse({ status: 409, description: 'The lot number is already on the item.' }),
  );
}

export function ApiUpdateLot() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a goods receipt lot',
      description: 'Changes the number, dates or printed MRP of a lot on a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lotId', description: 'Goods receipt lot ID' }),
    ApiBody({ type: UpdateGoodsReceiptLotDto }),
    ApiResponse({ status: 200, description: 'Lot updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt lot not found.' }),
    ApiResponse({ status: 409, description: 'The lot number is already on the item.' }),
  );
}

export function ApiRemoveLot() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a goods receipt lot',
      description: 'Removes a lot, with the lines it is distributed to, from a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lotId', description: 'Goods receipt lot ID' }),
    ApiResponse({ status: 200, description: 'Lot removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt lot not found.' }),
  );
}

export function ApiLinesTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the lines of a goods receipt item',
      description: "Returns a page of the item's lines using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Lines retrieved.', type: GoodsReceiptLineTableResponseDto }),
  );
}

export function ApiLinesByLotTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the lines of a goods receipt lot',
      description: "Returns a page of the lines the lot is distributed to, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lotId', description: 'Goods receipt lot ID' }),
    ApiResponse({ status: 200, description: 'Lines retrieved.', type: GoodsReceiptLineTableResponseDto }),
  );
}

export function ApiLineById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a goods receipt line',
      description: 'Returns the line with its location and lot.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiResponse({ status: 200, description: 'Line retrieved.', type: GoodsReceiptLineResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt line not found.' }),
  );
}

export function ApiAddLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a line to a goods receipt item',
      description:
        "Puts part of the item's accepted quantity at a location, in one of its lots when it is lot-tracked.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiBody({ type: AddGoodsReceiptLineDto }),
    ApiResponse({ status: 201, description: 'Line added.', type: GoodsReceiptLineResponseDto }),
    ApiResponse({
      status: 400,
      description: "The line exceeds the item's accepted quantity or its lot does not suit the item.",
    }),
    ApiResponse({ status: 409, description: 'The item already has a line at the location.' }),
  );
}

export function ApiUpdateLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a goods receipt line',
      description: 'Moves a line to another lot or location, or changes its quantity.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiBody({ type: UpdateGoodsReceiptLineDto }),
    ApiResponse({ status: 200, description: 'Line updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: "The line exceeds the item's accepted quantity or its lot does not suit the item.",
    }),
    ApiResponse({ status: 409, description: 'The item already has a line at the location.' }),
  );
}

export function ApiRemoveLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a goods receipt line',
      description: 'Removes a line, with its serials, from a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiResponse({ status: 200, description: 'Line removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt line not found.' }),
  );
}

export function ApiLineItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List the serials of a goods receipt line',
      description: "Returns a page of the serials registered on the line, using the user's saved table state.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiResponse({ status: 200, description: 'Serials retrieved.', type: GoodsReceiptLineItemTableResponseDto }),
  );
}

export function ApiAddLineItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a serial on a goods receipt line',
      description: 'Registers a new serial on a line of a serial-tracked item, up to the line quantity.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiBody({ type: AddGoodsReceiptLineItemDto }),
    ApiResponse({ status: 201, description: 'Serial added.', type: GoodsReceiptLineItemResponseDto }),
    ApiResponse({ status: 400, description: 'The item is not serial-tracked.' }),
    ApiResponse({ status: 409, description: 'The line is full, or the serial is already on it or in inventory.' }),
  );
}

export function ApiRemoveLineItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a serial from a goods receipt line',
      description: 'Removes a serial from a line of a draft receipt.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiParam({ name: 'lineId', description: 'Goods receipt line ID' }),
    ApiParam({ name: 'subItemId', description: 'Serial (line item) ID' }),
    ApiResponse({ status: 200, description: 'Serial removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Serial not found on the line.' }),
  );
}
