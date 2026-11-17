import { BlockSiteItemDto } from '@commerce/inventory-item-sites/dto/request/block-site-item.dto';
import { ReplenishmentDto } from '@commerce/inventory-item-sites/dto/request/replenishment.dto';
import { SetSupplierItemsRequiredDto } from '@commerce/inventory-item-sites/dto/request/set-supplier-items-required.dto';
import type { InventoryItemSiteResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-site-response.dto';
import { InventoryItemSiteParamsDto } from '@commerce/inventory-items/dto/request/inventory-item-site-params.dto';
import type { InventoryItemMrpTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-table-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type { InventoryItemSupplierTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type { SiteItemTableResponseDto } from '@commerce/inventory-items/dto/response/site-item-row-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import {
  ApiAddToSite,
  ApiBlockSiteItem,
  ApiFindSiteItemsTable,
  ApiRemoveFromSite,
  ApiSetSupplierItemsRequired,
  ApiUnblockSiteItem,
  ApiUpdateReplenishment,
} from './docs/inventory-items-gateway.docs';
import { LeInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - LE Inventory Items')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_INVENTORY_ITEMS.featureCode)
@Controller('le/inventory-items')
export class LeInventoryItemsGatewayController {
  private readonly logger = new Logger(LeInventoryItemsGatewayController.name);

  constructor(private readonly service: LeInventoryItemsGatewayService) {}

  // Adds the item to one of the legal entity's sites with how it is replenished there
  @Post(':id/sites/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.add)
  @ApiAddToSite()
  addToSite(
    @Param() { id, siteId }: InventoryItemSiteParamsDto,
    @Body() dto: ReplenishmentDto,
  ): Promise<CreateResponseDto<InventoryItemSiteResponseDto>> {
    this.logger.log(`POST /commerce-api/le/inventory-items/${id}/sites/${siteId}`);
    return this.service.addToSite(id, siteId, dto);
  }

  // Changes how one of the legal entity's sites replenishes the item
  @Patch(':id/sites/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.edit)
  @ApiUpdateReplenishment()
  updateReplenishment(
    @Param() { id, siteId }: InventoryItemSiteParamsDto,
    @Body() dto: ReplenishmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/inventory-items/${id}/sites/${siteId}`);
    return this.service.updateReplenishment(id, siteId, dto);
  }

  // Stops one of the legal entity's sites buying the item, with why
  @Post(':id/sites/:siteId/block')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.block)
  @HttpCode(HttpStatus.OK)
  @ApiBlockSiteItem()
  block(
    @Param() { id, siteId }: InventoryItemSiteParamsDto,
    @Body() dto: BlockSiteItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/inventory-items/${id}/sites/${siteId}/block`);
    return this.service.block(id, siteId, dto);
  }

  // Lets one of the legal entity's sites buy the item again
  @Post(':id/sites/:siteId/unblock')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.block)
  @HttpCode(HttpStatus.OK)
  @ApiUnblockSiteItem()
  unblock(@Param() { id, siteId }: InventoryItemSiteParamsDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/inventory-items/${id}/sites/${siteId}/unblock`);
    return this.service.unblock(id, siteId);
  }

  // Ties buying the item at one of the legal entity's sites to the supplier's item set up there, or frees it
  @Patch(':id/sites/:siteId/supplier-items-required')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.edit)
  @ApiSetSupplierItemsRequired()
  setSupplierItemsRequired(
    @Param() { id, siteId }: InventoryItemSiteParamsDto,
    @Body() dto: SetSupplierItemsRequiredDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/inventory-items/${id}/sites/${siteId}/supplier-items-required`);
    return this.service.setSupplierItemsRequired(id, siteId, dto);
  }

  // Returns one master item, read-only from a legal entity
  @Get(':id')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Returns the organization's master items, read-only from a legal entity
  @Get('table')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  getTable(@UserId() userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('GET /commerce-api/le/inventory-items/table');
    return this.service.findForTable(userId);
  }

  // Returns the MRPs of an item, table-shaped
  @Get(':id/mrp/table')
  @RequirePermission(LE_INVENTORY_ITEMS.mrp.view)
  getMrpTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemMrpTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/mrp/table`);
    return this.service.findMrpTable(id, userId);
  }

  // Returns the legal entity's suppliers carrying an item, table-shaped
  @Get(':id/suppliers/table')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns the legal entity's sites with how each carries the item and the stock it holds, for the data table
  @Get(':id/sites/table')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.view)
  @ApiFindSiteItemsTable()
  findSiteItemsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SiteItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/sites/table`);
    return this.service.findSiteItemsTable(id, userId, orgId, legalEntityId);
  }

  // Removes the item from one of the legal entity's sites
  @Delete(':id/sites/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.sites.delete)
  @ApiRemoveFromSite()
  removeFromSite(@Param() { id, siteId }: InventoryItemSiteParamsDto): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/inventory-items/${id}/sites/${siteId}`);
    return this.service.removeFromSite(id, siteId);
  }
}
