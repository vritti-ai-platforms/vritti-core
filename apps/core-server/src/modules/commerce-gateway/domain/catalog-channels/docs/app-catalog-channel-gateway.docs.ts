import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CatalogChannelResponseDto } from '../dto/response/catalog-channel-response.dto';

export function ApiUpsertAppChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set the catalog for the App channel',
      description:
        'Omit appId to set the fallback every unnamed caller resolves to; supply one to give a single app its own catalog. The scope comes from the workspace.',
    }),
    ApiResponse({ status: 200, type: CatalogChannelResponseDto }),
    ApiResponse({ status: 409, description: 'That target already sells this catalog.' }),
  );
}

export function ApiUpsertPosChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set the catalog for the POS channel',
      description:
        'Omit terminalId to sell this catalog at every terminal the workspace covers — an organization assignment is the fallback for every terminal, a company one for the terminals under it, an outlet one for its own. Supply a terminalId to give a single terminal its own catalog. The scope comes from the workspace.',
    }),
    ApiResponse({ status: 200, type: CatalogChannelResponseDto }),
    ApiResponse({ status: 409, description: 'That target already sells this catalog.' }),
  );
}

export function ApiUpsertB2bChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set the catalog for the B2B channel',
      description:
        'B2B names no target, so this is the single wholesale assignment for the workspace. The scope comes from the workspace.',
    }),
    ApiResponse({ status: 200, type: CatalogChannelResponseDto }),
    ApiResponse({ status: 409, description: 'B2B already sells this catalog at this scope.' }),
  );
}
