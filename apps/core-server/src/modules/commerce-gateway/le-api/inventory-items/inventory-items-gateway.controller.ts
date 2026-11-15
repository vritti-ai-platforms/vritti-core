import { CreateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/create-site-stock-levels.dto';
import { UpdateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/update-site-stock-levels.dto';
import type { InventoryItemMrpTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-table-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type { InventoryItemSiteStockLevelResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-site-stock-level-response.dto';
import type { InventoryItemSupplierTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type { SiteStockLevelTableResponseDto } from '@commerce/inventory-items/dto/response/site-stock-level-row-response.dto';
import { Body, Controller, Delete, Get, Logger, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import {
  ApiCreateSiteStockLevels,
  ApiDeleteSiteStockLevels,
  ApiFindSiteStockLevelsTable,
  ApiUpdateSiteStockLevels,
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

  // Returns the item's stock levels at the legal entity's sites, with the stock each holds, for the data table
  @Get(':id/site-stock-levels/table')
  @RequirePermission(LE_INVENTORY_ITEMS.siteStockLevels.view)
  @ApiFindSiteStockLevelsTable()
  findSiteStockLevelsTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SiteStockLevelTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/site-stock-levels/table`);
    return this.service.findSiteStockLevelsTable(id, userId, orgId, legalEntityId);
  }

  // Sets the item's stock levels at one of the legal entity's sites
  @Post(':id/site-stock-levels/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.siteStockLevels.add)
  @ApiCreateSiteStockLevels()
  createSiteStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() dto: CreateSiteStockLevelsDto,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<CreateResponseDto<InventoryItemSiteStockLevelResponseDto>> {
    this.logger.log(`POST /commerce-api/le/inventory-items/${id}/site-stock-levels/${siteId}`);
    return this.service.createSiteStockLevels(id, siteId, dto, legalEntityId);
  }

  // Updates the item's stock levels at one of the legal entity's sites
  @Patch(':id/site-stock-levels/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.siteStockLevels.edit)
  @ApiUpdateSiteStockLevels()
  updateSiteStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Body() dto: UpdateSiteStockLevelsDto,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/inventory-items/${id}/site-stock-levels/${siteId}`);
    return this.service.updateSiteStockLevels(id, siteId, dto, legalEntityId);
  }

  // Removes the item's stock levels at one of the legal entity's sites
  @Delete(':id/site-stock-levels/:siteId')
  @RequirePermission(LE_INVENTORY_ITEMS.siteStockLevels.delete)
  @ApiDeleteSiteStockLevels()
  deleteSiteStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/inventory-items/${id}/site-stock-levels/${siteId}`);
    return this.service.deleteSiteStockLevels(id, siteId, legalEntityId);
  }

  // Returns one master item, read-only from a legal entity
  @Get(':id')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}`);
    return this.service.findById(id);
  }
}
