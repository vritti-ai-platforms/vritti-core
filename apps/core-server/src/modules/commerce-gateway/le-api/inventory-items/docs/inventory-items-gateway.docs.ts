import { CreateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/create-site-stock-levels.dto';
import { UpdateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/update-site-stock-levels.dto';
import { InventoryItemSiteStockLevelResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-site-stock-level-response.dto';
import { SiteStockLevelTableResponseDto } from '@commerce/inventory-items/dto/response/site-stock-level-row-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = { name: 'id', description: 'Inventory item ID' };
const SITE_ID = { name: 'siteId', description: "ID of one of the legal entity's sites" };

export function ApiFindSiteStockLevelsTable() {
  return applyDecorators(
    ApiOperation({
      summary: "List the legal entity's sites with an inventory item's stock levels",
      description:
        "Returns the legal entity's sites, searched by name or code and paged by the user's saved table state, each with the item's stock levels there (null when not set), its stock on hand by location in the item's primary unit, its value in the legal entity's currency and its stock status. The status filter keeps the sites whose stock matches, and the sites without stock levels when No Stock Levels is picked.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Site stock levels retrieved.', type: SiteStockLevelTableResponseDto }),
    ApiResponse({ status: 400, description: 'The request was made outside a legal entity workspace.' }),
    ApiResponse({ status: 404, description: 'Inventory item not found.' }),
  );
}

export function ApiCreateSiteStockLevels() {
  return applyDecorators(
    ApiOperation({
      summary: "Set an inventory item's stock levels at a site",
      description:
        "Sets the item's stock levels at one of the legal entity's sites, which lets the site buy and stock it. The max level must be above 0, the reorder point at most the max level and the safety stock (0 when left out) at most the reorder point.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: CreateSiteStockLevelsDto }),
    ApiResponse({
      status: 201,
      description: 'Stock levels set for the site.',
      type: InventoryItemSiteStockLevelResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: "Validation failed, the levels are out of order, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'Inventory item or site not found.' }),
    ApiResponse({ status: 409, description: 'Stock levels are already set for the item at the site.' }),
  );
}

export function ApiUpdateSiteStockLevels() {
  return applyDecorators(
    ApiOperation({
      summary: "Update an inventory item's stock levels at a site",
      description: "Changes only the stock levels sent for the item at one of the legal entity's sites.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: UpdateSiteStockLevelsDto }),
    ApiResponse({ status: 200, description: 'Stock levels updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: "Validation failed, the levels are out of order, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'No stock levels are set for the item at the site.' }),
  );
}

export function ApiDeleteSiteStockLevels() {
  return applyDecorators(
    ApiOperation({
      summary: "Remove an inventory item's stock levels at a site",
      description:
        "Removes the item's stock levels at one of the legal entity's sites, which stops the site buying it.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiResponse({ status: 200, description: 'Stock levels removed for the site.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: "The site is not one of the legal entity's." }),
    ApiResponse({ status: 404, description: 'No stock levels are set for the item at the site.' }),
    ApiResponse({ status: 409, description: 'The item still has stock or open documents at the site.' }),
  );
}
