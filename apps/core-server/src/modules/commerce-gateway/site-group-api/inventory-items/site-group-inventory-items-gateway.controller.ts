import { GroupMatrixQueryDto } from '@commerce/site-group-inventory-items/dto/request/group-matrix-query.dto';
import type { SiteGroupInventoryItemResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-inventory-item-response.dto';
import type { SiteGroupInventoryItemTableResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-inventory-item-table-response.dto';
import type { SiteGroupItemAvailabilityResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-availability-response.dto';
import type { SiteGroupItemLevelsResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-levels-response.dto';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { SITE_GROUP_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SiteGroupInventoryItemsGatewayService } from './services/site-group-inventory-items-gateway.service';

@ApiTags('Commerce - Site Group Inventory Items')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_GROUP_INVENTORY_ITEMS.featureCode)
@Controller('site-group/inventory-items')
export class SiteGroupInventoryItemsGatewayController {
  private readonly logger = new Logger(SiteGroupInventoryItemsGatewayController.name);

  constructor(private readonly service: SiteGroupInventoryItemsGatewayService) {}

  // Returns every master item with how many of the group's sites have it enabled
  @Get('table')
  @RequirePermission(SITE_GROUP_INVENTORY_ITEMS.view)
  getTable(@UserId() userId: string): Promise<SiteGroupInventoryItemTableResponseDto> {
    this.logger.log('GET /commerce-api/site-group/inventory-items/table');
    return this.service.findForTable(userId);
  }

  // Returns the full item × site availability matrix across the group's sites
  @Get('matrix')
  @RequirePermission(SITE_GROUP_INVENTORY_ITEMS.view)
  getMatrix(@Query() query: GroupMatrixQueryDto): Promise<SiteGroupInventoryItemResponseDto[]> {
    this.logger.log('GET /commerce-api/site-group/inventory-items/matrix');
    return this.service.findMatrix(query.siteIds);
  }

  // Returns availability grouped per item across the group's sites
  @Get('availability')
  @RequirePermission(SITE_GROUP_INVENTORY_ITEMS.view)
  getAvailability(@Query() query: GroupMatrixQueryDto): Promise<SiteGroupItemAvailabilityResponseDto[]> {
    this.logger.log('GET /commerce-api/site-group/inventory-items/availability');
    return this.service.findAvailability(query.siteIds);
  }

  // Returns per-site reorder/max/safety levels across the group
  @Get('levels')
  @RequirePermission(SITE_GROUP_INVENTORY_ITEMS.view)
  getLevels(@Query() query: GroupMatrixQueryDto): Promise<SiteGroupItemLevelsResponseDto[]> {
    this.logger.log('GET /commerce-api/site-group/inventory-items/levels');
    return this.service.findLevels(query.siteIds);
  }
}
