import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryItemsFeedQueryDto } from '../dto/request/inventory-items-feed-query.dto';
import { InventoryItemFeedResponseDto } from '../dto/response/inventory-item-feed-response.dto';

export function ApiFeedInventoryItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'Inventory items feed (cursor pagination)',
      description:
        'Returns keyset/cursor-paginated inventory items for infinite scroll. Pass the returned nextCursor to fetch the next page.',
    }),
    ApiBody({ type: InventoryItemsFeedQueryDto }),
    ApiResponse({ status: 200, description: 'Inventory items page retrieved.', type: InventoryItemFeedResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid query.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
