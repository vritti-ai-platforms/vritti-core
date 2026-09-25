import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CatalogListingMrpOptionResponseDto,
  CatalogListingResponseDto,
} from '../dto/response/catalog-listing-response.dto';
import { CatalogListingTableResponseDto } from '../dto/response/catalog-listing-table-response.dto';
import { CatalogResponseDto } from '../dto/response/catalog-response.dto';
import { CatalogTableResponseDto } from '../dto/response/catalog-table-response.dto';

const ID = { name: 'id', description: 'Catalog identifier' };
const LISTING_ID = { name: 'listingId', description: 'Listing identifier' };
const NOT_FOUND = { status: 404, description: 'Catalog not found.' };

export function ApiCatalogsTable() {
  return applyDecorators(
    ApiOperation({ summary: 'List catalogs', description: 'Paginated, filtered and sorted for the data table.' }),
    ApiResponse({ status: 200, type: CatalogTableResponseDto }),
  );
}

export function ApiGetCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a catalog' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: CatalogResponseDto }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiCreateCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a catalog' }),
    ApiResponse({ status: 201, type: CatalogResponseDto }),
    ApiResponse({ status: 409, description: 'A catalog with that name already exists.' }),
  );
}

export function ApiUpdateCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a catalog' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Catalog updated.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiDeleteCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a catalog', description: 'Refused while it still lists anything.' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Catalog deleted.' }),
    ApiResponse({ status: 409, description: 'Catalog still has listings.' }),
  );
}

export function ApiCatalogListingsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'List a catalog’s listings',
      description: 'One row per listing. The same variant appears once per MRP slice it is listed at.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: CatalogListingTableResponseDto }),
  );
}

export function ApiCatalogListingMrpOptions() {
  return applyDecorators(
    ApiOperation({
      summary: 'MRP slices a variant can be listed at',
      description: 'The MRPs recorded against the inventory item the variant draws on.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: [CatalogListingMrpOptionResponseDto] }),
  );
}

export function ApiCatalogChannels() {
  return applyDecorators(
    ApiOperation({
      summary: 'Channels selling this catalog',
      description: 'Read-only — bindings are managed on the Catalog Channels page.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Channels selling this catalog.' }),
  );
}

export function ApiSetCatalogListingChannelVisibility() {
  return applyDecorators(
    ApiOperation({
      summary: 'Hide or show a listing on one channel',
      description: 'A listing sells on every channel of its catalog unless hidden here.',
    }),
    ApiParam(ID),
    ApiParam(LISTING_ID),
    ApiParam({ name: 'channelId', description: 'Channel identifier' }),
    ApiResponse({ status: 200, description: 'Visibility changed.' }),
  );
}

export function ApiAddCatalogListing() {
  return applyDecorators(
    ApiOperation({
      summary: 'List a variant in a catalog',
      description:
        'Optionally keyed to one MRP slice. A variant is listed either generally or by MRP — never both in one catalog.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 201, type: CatalogListingResponseDto }),
    ApiResponse({ status: 409, description: 'Already listed, or the price exceeds the printed MRP.' }),
  );
}

export function ApiSetCatalogListingPrice() {
  return applyDecorators(
    ApiOperation({ summary: 'Set a listing’s price', description: 'Refused above the MRP the listing is keyed to.' }),
    ApiParam(ID),
    ApiParam(LISTING_ID),
    ApiResponse({ status: 200, description: 'Price updated.' }),
    ApiResponse({ status: 409, description: 'Price exceeds the printed MRP.' }),
  );
}

export function ApiDeleteCatalogListing() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a listing from a catalog' }),
    ApiParam(ID),
    ApiParam(LISTING_ID),
    ApiResponse({ status: 200, description: 'Listing removed.' }),
  );
}
