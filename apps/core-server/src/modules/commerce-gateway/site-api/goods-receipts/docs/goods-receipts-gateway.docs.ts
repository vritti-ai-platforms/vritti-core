import { AddGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line.dto';
import { AddGoodsReceiptLineItemDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-line-item.dto';
import { AddGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/add-goods-receipt-lot.dto';
import { CreateGoodsReceiptFromDeliveryDto } from '@commerce/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import { UpdateGoodsReceiptDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt.dto';
import { UpdateGoodsReceiptItemDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-item.dto';
import { UpdateGoodsReceiptLineDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-line.dto';
import { UpdateGoodsReceiptLotDto } from '@commerce/goods-receipts/dto/request/update-goods-receipt-lot.dto';
import { CreatedGoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/created-goods-receipt-response.dto';
import { GoodsReceiptCountsResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-counts-response.dto';
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
        "Creates a draft receipt of an announced inbound delivery at the site — not received or cancelled and without a draft receipt — pre-filled with each delivery line's open quantity (delivery quantity less what posted receipts accepted against it) on confirmed purchase orders. Each item records its delivery line and the quantity in the line unit and in primary units. A goods receipt is created only from an announced delivery.",
    }),
    ApiBody({ type: CreateGoodsReceiptFromDeliveryDto }),
    ApiResponse({ status: 201, description: 'Goods receipt created.', type: CreatedGoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The delivery is not announced, is received or cancelled, has nothing open on a confirmed purchase order, or the supplier is blocked at the site.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
    ApiResponse({
      status: 409,
      description: 'A draft goods receipt of the delivery is already open (Draft Receipt Exists).',
    }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a goods receipt',
      description:
        "Changes a draft receipt's notes. The supplier's delivery note (challan) number and date are edited on the inbound delivery.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiBody({ type: UpdateGoodsReceiptDto }),
    ApiResponse({ status: 200, description: 'Goods receipt updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is posted.' }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
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
        'Returns the receipt with its supplier, inbound delivery, purchase order numbers and whether it is ready to post.',
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

export function ApiPost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Post a goods receipt',
      description:
        "Lands the accepted stock at the receipt's site valued provisionally from the purchase order lines, moves the accepted and rejected primary quantities of its purchase order lines, the receipt and invoice status of every order it counts and the delivery's status. Over-receipt and short expiry are only flagged.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 201, description: 'Goods receipt posted.', type: GoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "The receipt is already posted, not every item is fully distributed, or an item has no stock levels set at the receipt's site.",
    }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
    ApiResponse({
      status: 409,
      description:
        'A lot number already exists for the item with another MRP (Lot MRP Differs); the lot keeps its MRP; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiFindGoodsReceiptCounts() {
  return applyDecorators(
    ApiOperation({
      summary: "Count a goods receipt's items",
      description:
        "One count per tab of the receipt's detail page — its breakdown and its items cost both list its items — so each tab can show how many rows it lists.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Counts retrieved.', type: GoodsReceiptCountsResponseDto }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a goods receipt',
      description: 'Deletes a draft receipt with everything counted on it; its inbound delivery is never deleted.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiResponse({ status: 200, description: 'Goods receipt deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is posted.' }),
    ApiResponse({ status: 404, description: 'Goods receipt not found.' }),
    ApiResponse({
      status: 409,
      description: 'A Purchase created the receipt, or it is a Receive with Invoice draft (Belongs to a Purchase).',
    }),
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
      description: 'Returns the quants a posted receipt item landed in, with their cost.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Quants retrieved.', type: GoodsReceiptItemQuantsResponseDto }),
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
      description:
        "Changes the received or rejected quantity of an item on a draft receipt, storing them also in the item's primary unit; its delivery line is left unchanged.",
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiBody({ type: UpdateGoodsReceiptItemDto }),
    ApiResponse({ status: 200, description: 'Item updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is posted or more is rejected than received.' }),
    ApiResponse({ status: 404, description: 'Goods receipt item not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}

export function ApiRemoveItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a goods receipt item',
      description:
        'Removes an item, with its lots and lines, from a draft receipt; its delivery line is left unchanged.',
    }),
    ApiParam({ name: 'id', description: 'Goods receipt ID' }),
    ApiParam({ name: 'itemId', description: 'Goods receipt item ID' }),
    ApiResponse({ status: 200, description: 'Item removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The receipt is posted.' }),
    ApiResponse({ status: 404, description: 'Goods receipt item not found.' }),
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
        "The receipt is posted, the item is not lot-tracked or the MRP is not in the legal entity's currency.",
    }),
    ApiResponse({
      status: 409,
      description:
        'The lot number is already on the item; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The lot number is already on the item; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The item already has a line at the location; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The item already has a line at the location; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The line is full, or the serial is already on it or in inventory; or the receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
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
    ApiResponse({
      status: 409,
      description:
        'The receipt is a Receive with Invoice draft, changed only through its Purchase (Belongs to a Purchase).',
    }),
  );
}
