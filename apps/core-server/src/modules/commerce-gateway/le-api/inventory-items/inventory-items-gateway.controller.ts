import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type { InventoryItemSupplierTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
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

  // Returns the MRPs of an item
  @Get(':id/mrp')
  @RequirePermission(LE_INVENTORY_ITEMS.mrp.view)
  getMrp(@Param('id') id: string): Promise<InventoryItemMrpResponseDto[]> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/mrp`);
    return this.service.findMrp(id);
  }

  // Returns the legal entity's suppliers carrying an item, table-shaped
  @Get(':id/suppliers/table')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns one master item, read-only from a legal entity
  @Get(':id')
  @RequirePermission(LE_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}`);
    return this.service.findById(id);
  }
}
