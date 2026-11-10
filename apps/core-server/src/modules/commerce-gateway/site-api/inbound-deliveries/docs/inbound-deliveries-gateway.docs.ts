import { GoodsReceiptResponseDto } from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import { AddInboundDeliveryLinesDto } from '@commerce/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import { CreateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import { ReceiveInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/receive-inbound-delivery.dto';
import { SetInboundDeliveryStatusDto } from '@commerce/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import { UpdateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import { UpdateInboundDeliveryLineDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

export function ApiFindForTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List inbound deliveries',
      description: "Returns a page of the site's inbound deliveries using the user's saved table state.",
    }),
    ApiResponse({ status: 200, description: 'Inbound deliveries retrieved.', type: InboundDeliveryTableResponseDto }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an inbound delivery',
      description:
        'Returns the delivery with its supplier, purchase order numbers, goods receipts and what may still happen to it.',
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiResponse({ status: 200, description: 'Inbound delivery retrieved.', type: InboundDeliveryResponseDto }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
  );
}

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an inbound delivery',
      description:
        "Creates a PLANNED delivery of one supplier at the site, without lines yet, with the supplier's delivery note (challan) number and date when known.",
    }),
    ApiBody({ type: CreateInboundDeliveryDto }),
    ApiResponse({ status: 201, description: 'Inbound delivery created.', type: InboundDeliveryResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The supplier is not enrolled, inactive or blocked at the site, or the delivery note is dated after the expected delivery date.',
    }),
    ApiResponse({
      status: 409,
      description: "The supplier's delivery note number is already on another non-cancelled delivery of the supplier.",
    }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an inbound delivery',
      description:
        "Changes the expected date, carrier, tracking number, supplier's delivery note or notes of an announced delivery until it is received or cancelled; the expected delivery of its PO lines moves to the latest date of the live deliveries holding them, in the same transaction. A delivery a goods receipt created is edited on that receipt.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiBody({ type: UpdateInboundDeliveryDto }),
    ApiResponse({ status: 200, description: 'Inbound delivery updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The delivery is received, cancelled or created by a goods receipt, or its delivery note would be dated after its expected delivery date.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
    ApiResponse({
      status: 409,
      description: "The supplier's delivery note number is already on another non-cancelled delivery of the supplier.",
    }),
  );
}

export function ApiSetStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change an inbound delivery status',
      description:
        'Moves the delivery forward from PLANNED through IN_TRANSIT to ARRIVED, or cancels it while no goods receipt names it. PARTIALLY_RECEIVED and RECEIVED are set by published goods receipts.',
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiBody({ type: SetInboundDeliveryStatusDto }),
    ApiResponse({ status: 200, description: 'Status changed.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The move is not allowed from the current status, or a goods receipt blocks cancelling.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
  );
}

export function ApiReceive() {
  return applyDecorators(
    ApiOperation({
      summary: 'Receive an inbound delivery',
      description:
        "Creates a DRAFT goods receipt against the delivery, pre-filled with each line's quantity still open against it, and returns it.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiBody({ type: ReceiveInboundDeliveryDto }),
    ApiResponse({ status: 201, description: 'Goods receipt created.', type: GoodsReceiptResponseDto }),
    ApiResponse({
      status: 400,
      description: 'The delivery is received or cancelled, nothing is left to receive, or the supplier is blocked.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
    ApiResponse({ status: 409, description: 'A draft goods receipt against the delivery is already open.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an inbound delivery',
      description: 'Deletes a PLANNED delivery without lines or goods receipts.',
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiResponse({ status: 200, description: 'Inbound delivery deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The delivery is not planned, or has lines or goods receipts.' }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
  );
}

export function ApiLinesTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List inbound delivery lines',
      description:
        "Returns a page of the delivery's lines with their PO line, ordered and received quantities, what is received against the delivery and how far each may be raised.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiResponse({ status: 200, description: 'Lines retrieved.', type: InboundDeliveryLineTableResponseDto }),
  );
}

export function ApiAddLines() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add lines to an inbound delivery',
      description:
        "Puts lines of the supplier's sent, confirmed or partially received purchase orders for the site on the delivery. A SENT order moves to CONFIRMED and each line's expected delivery follows the delivery, in the same transaction. Per PO line, what live deliveries still expect cannot exceed ordered + free less accepted.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiBody({ type: AddInboundDeliveryLinesDto }),
    ApiResponse({ status: 201, description: 'Lines added.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        'The delivery is received or cancelled, a line is of another supplier or site, its order is not open, or a quantity exceeds what the line has left.',
    }),
    ApiResponse({ status: 404, description: 'Inbound delivery or purchase order line not found.' }),
    ApiResponse({ status: 409, description: 'A purchase order line is already on the delivery.' }),
  );
}

export function ApiUpdateLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an inbound delivery line',
      description:
        "Changes a line's quantity — not below what is received against the delivery, nor above what its PO line has left.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiParam({ name: 'lineId', description: 'Delivery line ID' }),
    ApiBody({ type: UpdateInboundDeliveryLineDto }),
    ApiResponse({ status: 200, description: 'Line updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The delivery is locked or the quantity is out of range.' }),
    ApiResponse({ status: 404, description: 'Inbound delivery or line not found.' }),
  );
}

export function ApiRemoveLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove an inbound delivery line',
      description:
        "Removes a line nothing is received against; its PO line's expected delivery follows the deliveries still holding it, or keeps its date.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiParam({ name: 'lineId', description: 'Delivery line ID' }),
    ApiResponse({ status: 200, description: 'Line removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The delivery is locked or goods are received against the line.' }),
    ApiResponse({ status: 404, description: 'Inbound delivery or line not found.' }),
  );
}
