import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CatalogChannelResponseDto,
  CatalogChannelTableResponseDto,
} from '../dto/response/catalog-channel-response.dto';
import { ChannelItemTableResponseDto } from '../dto/response/channel-item-response.dto';

const CHANNEL = { name: 'channelId', description: 'Channel identifier' };

export function ApiAppChannels() {
  return applyDecorators(
    ApiOperation({
      summary: 'App channels',
      description:
        'One row per channel: the wildcard every unnamed caller falls back to, plus any named app that overrides it. App names come from the core app registry, so a revoked app drops out.',
    }),
    ApiResponse({ status: 200, type: CatalogChannelTableResponseDto }),
  );
}

export function ApiCreateAppChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a catalog to the App channel',
      description:
        'Omit appId to set the fallback every unnamed caller resolves to; supply one to give a single app its own catalog. The scope comes from the workspace.',
    }),
    ApiResponse({ status: 201, type: CatalogChannelResponseDto }),
    ApiResponse({ status: 409, description: 'That combination already has a catalog at this scope.' }),
  );
}

export function ApiUpdateAppChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Point a channel at a different catalog',
      description: 'Rejected when the channel is inherited — change it in the workspace that set it.',
    }),
    ApiParam(CHANNEL),
    ApiResponse({ status: 200, description: 'Channel repointed.' }),
    ApiResponse({ status: 409, description: 'The channel is set by a wider scope.' }),
  );
}

export function ApiDeleteAppChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a channel',
      description:
        'A named app falls back to the wildcard. Removing the wildcard leaves the channel resolving to a wider scope, or to nothing at the organization.',
    }),
    ApiParam(CHANNEL),
    ApiResponse({ status: 200, description: 'Channel removed.' }),
    ApiResponse({ status: 409, description: 'The channel is set by a wider scope.' }),
  );
}

export function ApiAppChannelItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'What one channel sells',
      description:
        'The resolved catalog — every active listing, each flagged with whether this channel excludes it. Inactive listings never reach a channel and are not returned.',
    }),
    ApiParam(CHANNEL),
    ApiResponse({ status: 200, type: ChannelItemTableResponseDto }),
  );
}

export function ApiSetAppChannelItemVisibility() {
  return applyDecorators(
    ApiOperation({
      summary: 'Exclude or re-include an item',
      description:
        'Writes an exclusion against this channel only. Rejected when the channel is inherited — override it first, or the change would alter what every sibling inheriting it sells.',
    }),
    ApiParam(CHANNEL),
    ApiParam({ name: 'listingId', description: 'Catalog listing identifier' }),
    ApiResponse({ status: 200, description: 'Visibility updated.' }),
    ApiResponse({ status: 409, description: 'The channel is set by a wider scope.' }),
  );
}
