import { ItemSupplierPriceComparisonTableResponseDto } from '@commerce/inventory-items/dto/response/item-supplier-price-comparison-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Inventory item ID' };

export function ApiInventoryItemPricesTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Supplier prices table of an inventory item',
      description:
        "Every supplier's standing for the item at the site in the caller's saved table state (`filters.context`, field `site`) on its context day (field `asOf`, YYYY-MM-DD): the price in force, per the item's primary unit and after its free-goods scheme. Both are required context — a state without either has no rows.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: ItemSupplierPriceComparisonTableResponseDto }),
  );
}
