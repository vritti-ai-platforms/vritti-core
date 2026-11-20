import { BlockSiteItemDto } from '@commerce/inventory-item-sites/dto/request/block-site-item.dto';
import { ReplenishmentDto } from '@commerce/inventory-item-sites/dto/request/replenishment.dto';
import { SetSupplierItemsRequiredDto } from '@commerce/inventory-item-sites/dto/request/set-supplier-items-required.dto';
import { InventoryItemSiteResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-site-response.dto';
import { AddInventoryItemSupplierDto } from '@commerce/inventory-items/dto/request/add-inventory-item-supplier.dto';
import { SiteItemTableResponseDto } from '@commerce/inventory-items/dto/response/site-item-row-response.dto';
import { SupplierItemResponseDto } from '@commerce/suppliers/dto/response/supplier-item-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

const ID = { name: 'id', description: 'Inventory item ID' };
const SITE_ID = { name: 'siteId', description: "ID of one of the legal entity's sites" };
const LEVELS_RULE =
  "With REORDER_POINT the reorder point must be above 0, the maximum stock at least the reorder point and the safety stock (empty when left out) at most the reorder point, each a whole number when the item's unit cannot be split; with MANUAL no levels are kept.";

export function ApiFindSiteItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: "List the legal entity's sites with how each carries an inventory item",
      description:
        "Returns the legal entity's sites, searched by name or code and paged by the user's saved table state, each with how it carries the item (null when it does not): its purchasing status, replenishment and levels, its stock on hand by location in the item's primary unit, its value in the legal entity's currency and its stock status. The status filter keeps the sites whose stock matches, the blocked ones when Blocked is picked, and the sites that do not carry the item when Not at site is picked.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Site items retrieved.', type: SiteItemTableResponseDto }),
    ApiResponse({ status: 400, description: 'The request was made outside a legal entity workspace.' }),
    ApiResponse({ status: 404, description: 'Inventory item not found.' }),
  );
}

export function ApiAddToSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add an inventory item to a site',
      description: `Adds the item to one of the legal entity's sites with how the site replenishes it, which lets the site buy and stock it. ${LEVELS_RULE}`,
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: ReplenishmentDto }),
    ApiResponse({ status: 201, description: 'Item added to the site.', type: InventoryItemSiteResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "Validation failed, the levels are out of order or not whole numbers in a unit that cannot be split, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 409, description: 'The site already carries the item.' }),
  );
}

export function ApiAddSupplier() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a supplier to an inventory item',
      description:
        "Sets the item up as one of a legal entity supplier's items: the unit the supplier sells and prices it in, the supplier's own code, the least it sells per order, the default lead time, and the sites enrolled with the supplier that buy the item from them. The same as adding the item from the supplier.",
    }),
    ApiParam(ID),
    ApiBody({ type: AddInventoryItemSupplierDto }),
    ApiResponse({ status: 201, description: 'Supplier added to the item.', type: SupplierItemResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "Validation failed, the unit is not one the item allows, the supplier already has the item in that unit, a site is not enrolled with the supplier or not one of the legal entity's, or the minimum order is not whole in a unit that cannot be split.",
    }),
    ApiResponse({ status: 404, description: 'Supplier or inventory item not found.' }),
  );
}

export function ApiUpdateReplenishment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change how a site replenishes an inventory item',
      description: `Replaces the replenishment and levels of the item at one of the legal entity's sites. ${LEVELS_RULE}`,
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: ReplenishmentDto }),
    ApiResponse({ status: 200, description: 'Replenishment updated.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description:
        "Validation failed, the levels are out of order or not whole numbers in a unit that cannot be split, or the site is not one of the legal entity's.",
    }),
    ApiResponse({ status: 404, description: 'The site does not carry the item.' }),
  );
}

export function ApiBlockSiteItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Block purchasing of an inventory item at a site',
      description:
        "Stops one of the legal entity's sites adding the item to purchases or purchase orders, with a reason; stock on hand and goods already ordered still move.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: BlockSiteItemDto }),
    ApiResponse({ status: 200, description: 'Purchasing blocked at the site.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'The site does not carry the item.' }),
    ApiResponse({ status: 409, description: 'Purchasing is already blocked.' }),
  );
}

export function ApiUnblockSiteItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Unblock purchasing of an inventory item at a site',
      description: "Lets one of the legal entity's sites buy the item again.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiResponse({ status: 200, description: 'Purchasing unblocked at the site.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'The site does not carry the item.' }),
    ApiResponse({ status: 409, description: 'Purchasing is not blocked.' }),
  );
}

export function ApiSetSupplierItemsRequired() {
  return applyDecorators(
    ApiOperation({
      summary: 'Require supplier items to buy an inventory item at a site',
      description:
        "Ties buying the item at one of the legal entity's sites to the supplier's item set up there (SAP's source list " +
        "requirement per material at a plant), or leaves it to the site's own rule.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiBody({ type: SetSupplierItemsRequiredDto }),
    ApiResponse({ status: 200, description: 'Rule set.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'The site does not carry the item.' }),
  );
}

export function ApiRemoveFromSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove an inventory item from a site',
      description:
        "Removes the item from one of the legal entity's sites, which stops the site buying and stocking it.",
    }),
    ApiParam(ID),
    ApiParam(SITE_ID),
    ApiResponse({ status: 200, description: 'Item removed from the site.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: "The site is not one of the legal entity's." }),
    ApiResponse({ status: 404, description: 'The site does not carry the item.' }),
    ApiResponse({ status: 409, description: 'The item still has stock or open purchases at the site.' }),
  );
}
