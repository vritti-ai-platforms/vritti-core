import { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import { LeInboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-response.dto';
import { LeInboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiFindForTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List inbound deliveries',
      description:
        "Returns a page of the inbound deliveries of the legal entity's sites with site names, using the user's saved table state; the sites picked in the table's context bar (`filters.context`) narrow it.",
    }),
    ApiResponse({ status: 200, description: 'Inbound deliveries retrieved.', type: LeInboundDeliveryTableResponseDto }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an inbound delivery',
      description:
        "Returns one inbound delivery of the legal entity's sites with its site, supplier, purchase order numbers and goods receipts.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiResponse({ status: 200, description: 'Inbound delivery retrieved.', type: LeInboundDeliveryResponseDto }),
    ApiResponse({ status: 404, description: 'Inbound delivery not found.' }),
  );
}

export function ApiLinesTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List inbound delivery lines',
      description:
        "Returns a page of the delivery's lines with their PO line, ordered and received quantities and what is received against the delivery.",
    }),
    ApiParam({ name: 'id', description: 'Inbound delivery ID' }),
    ApiResponse({ status: 200, description: 'Lines retrieved.', type: InboundDeliveryLineTableResponseDto }),
  );
}
