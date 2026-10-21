import { PayoutChannelDto } from '@domain/payout-channel/dto/entity/payout-channel.dto';
import { CreatePayoutChannelDto } from '@domain/payout-channel/dto/request/create-payout-channel.dto';
import { UpdatePayoutChannelDto } from '@domain/payout-channel/dto/request/update-payout-channel.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = ApiParam({ name: 'id', description: 'Payout channel ID' });
const ORG_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
  ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
];
const UNAUTHORIZED = ApiResponse({ status: 401, description: 'Invalid or missing request signature.' });
const NOT_FOUND = ApiResponse({ status: 404, description: 'Payout channel not found.' });

export function ApiListPayoutChannelsInternal() {
  return applyDecorators(
    ApiOperation({
      summary: "List a legal entity's payout channels",
      description:
        "Every payout channel of the legal entity, its sites' included, with the payout account, gateway and bank account each uses.",
    }),
    ...ORG_HEADERS,
    ApiQuery({ name: 'legalEntityId', required: true }),
    ApiResponse({ status: 200, description: 'Payout channels retrieved.', type: [PayoutChannelDto] }),
    UNAUTHORIZED,
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
  );
}

export function ApiCreatePayoutChannelInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a payout channel',
      description:
        "Points the legal entity, one of its sites, an app or a sales channel at one of the legal entity's payout accounts. A scope has at most one payout channel per gateway.",
    }),
    ...ORG_HEADERS,
    ApiBody({ type: CreatePayoutChannelDto }),
    ApiResponse({ status: 201, description: 'Payout channel added.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid payout account, site or app.' }),
    UNAUTHORIZED,
    ApiResponse({ status: 409, description: 'This scope already pays out through that gateway.' }),
  );
}

export function ApiUpdatePayoutChannelInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change a payout channel',
      description: 'Points the channel at another payout account of the same legal entity; its scope is fixed.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiBody({ type: UpdatePayoutChannelDto }),
    ApiResponse({ status: 200, description: 'Payout channel updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'A payout account of another legal entity.' }),
    UNAUTHORIZED,
    NOT_FOUND,
    ApiResponse({ status: 409, description: 'This scope already pays out through that gateway.' }),
  );
}

export function ApiDeletePayoutChannelInternal() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a payout channel',
      description: 'Payments it covered fall back to the next payout channel that fits, or stop.',
    }),
    ...ORG_HEADERS,
    ID,
    ApiResponse({ status: 200, description: 'Payout channel removed.', type: SuccessResponseDto }),
    UNAUTHORIZED,
    NOT_FOUND,
  );
}
