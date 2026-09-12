import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CatalogChannelResponseDto, ResolvedCatalogResponseDto } from '../dto/response/catalog-channel-response.dto';
import { CatalogChannelTableResponseDto } from '../dto/response/catalog-channel-table-response.dto';

const ID = { name: 'id', description: 'Channel identifier' };

export function ApiCatalogChannelsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List channel bindings',
      description: 'Every channel and the catalog it currently sells.',
    }),
    ApiResponse({ status: 200, type: CatalogChannelTableResponseDto }),
  );
}

export function ApiResolveCatalogChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Which catalog does this channel sell?',
      description:
        'Diagnostic. Real callers never pass a type — theirs is fixed by the API surface they authenticated against.',
    }),
    ApiResponse({ status: 200, type: ResolvedCatalogResponseDto }),
    ApiResponse({ status: 404, description: 'No catalog is configured for this channel.' }),
  );
}

export function ApiCreateCatalogChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bind a channel to a catalog',
      description: 'One catalog per channel per scope, so resolution never has a tie to break.',
    }),
    ApiResponse({ status: 201, type: CatalogChannelResponseDto }),
    ApiResponse({ status: 409, description: 'Another catalog already sells on this channel at this scope.' }),
  );
}

export function ApiRepointCatalogChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Point a channel at a different catalog',
      description: 'Scope and target are fixed once a channel exists — only the catalog changes.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Channel repointed.' }),
    ApiResponse({ status: 404, description: 'Channel or catalog not found.' }),
  );
}

export function ApiDeleteCatalogChannel() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a channel binding' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Channel removed.' }),
  );
}
