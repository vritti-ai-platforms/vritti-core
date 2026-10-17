import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelEntryResponseDto } from '../dto/response/catalog-channel-response.dto';
import { ChannelItemResponseDto, ChannelPriceTableResponseDto } from '../dto/response/channel-item-response.dto';

export function ApiListCatalogChannels() {
  return applyDecorators(
    ApiOperation({
      summary: 'What every sales surface of this workspace carries',
      description:
        'One entry per channel type. Each carries the effective default — the nearest assignment at or above this workspace — and, for App and POS, one target per app or terminal with the assignment that overrides the default, or null when it follows it. B2B returns no targets; POS returns none above an outlet, where terminals are not visible.',
    }),
    ApiResponse({ status: 200, type: [ChannelEntryResponseDto] }),
  );
}

export function ApiDeleteChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a channel assignment',
      description:
        'The catalog itself is untouched; callers fall back to this workspace’s default, then to a wider one. Rejected when the channel is inherited.',
    }),
    ApiResponse({ status: 200, description: 'Assignment removed.' }),
    ApiResponse({ status: 403, description: 'The channel belongs to a wider scope.' }),
  );
}

export function ApiChannelItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'What one channel carries',
      description: 'Every active item in the channel’s catalog, each flagged with whether this channel carries it.',
    }),
    ApiResponse({ status: 200, type: [ChannelItemResponseDto] }),
  );
}

export function ApiChannelCurrencies() {
  return applyDecorators(
    ApiOperation({
      summary: 'Currencies this channel can quote in',
      description: 'The currencies its catalog is priced in, in the order the catalog offers them.',
    }),
    ApiResponse({ status: 200, type: [String] }),
  );
}

export function ApiChannelPrices() {
  return applyDecorators(
    ApiOperation({
      summary: 'What one channel charges in one currency',
      description:
        'Every active item in the channel’s catalog with the price this workspace quotes it at, and whether it is available in that currency.',
    }),
    ApiResponse({ status: 200, type: ChannelPriceTableResponseDto }),
  );
}

export function ApiSetChannelItemVisibility() {
  return applyDecorators(
    ApiOperation({
      summary: 'Include or exclude one item on this channel',
      description:
        'Naming a currency excludes the item from callers asking in it while the others stay available; omitting one excludes it outright. Exclusions belong to the channel, so this is refused unless this workspace owns it — override the channel first to choose what it carries.',
    }),
    ApiResponse({ status: 200, description: 'Visibility updated.' }),
    ApiResponse({ status: 403, description: 'The channel belongs to a wider scope.' }),
  );
}
