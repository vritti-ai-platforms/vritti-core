import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelEntryResponseDto } from '../dto/response/catalog-channel-response.dto';
import { ChannelItemResponseDto } from '../dto/response/channel-item-response.dto';

export function ApiListCatalogChannels() {
  return applyDecorators(
    ApiOperation({
      summary: 'What every selling surface of this workspace sells',
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
      summary: 'What one channel sells',
      description: 'Every active item in the channel’s catalog, each flagged with whether this channel sells it.',
    }),
    ApiResponse({ status: 200, type: [ChannelItemResponseDto] }),
  );
}

export function ApiSetChannelItemVisibility() {
  return applyDecorators(
    ApiOperation({
      summary: 'Include or exclude one item on this channel',
      description:
        'Exclusions belong to the channel, so this is refused unless this workspace owns it — override the channel first to choose what it sells.',
    }),
    ApiResponse({ status: 200, description: 'Visibility updated.' }),
    ApiResponse({ status: 403, description: 'The channel belongs to a wider scope.' }),
  );
}
