import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelOverviewResponseDto } from '../dto/response/catalog-channel-response.dto';

export function ApiCatalogChannelsOverview() {
  return applyDecorators(
    ApiOperation({
      summary: 'What this workspace sells through each channel',
      description:
        'Always returns every type. A type this workspace has not set still reports the catalog it inherits, and from which scope.',
    }),
    ApiResponse({ status: 200, type: [ChannelOverviewResponseDto] }),
  );
}
