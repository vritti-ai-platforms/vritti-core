import { EnrollSiteSupplierDto } from '@commerce/supplier-sites/dto/request/enroll-site-supplier.dto';
import { UpdateSiteSupplierEnrollmentDto } from '@commerce/supplier-sites/dto/request/update-site-supplier-enrollment.dto';
import type { SiteSupplierEnrollmentResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-enrollment-response.dto';
import type { SiteSupplierItemResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-response.dto';
import type { SiteSupplierItemTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-item-table-response.dto';
import type { SiteSupplierResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-response.dto';
import type { SiteSupplierTableResponseDto } from '@commerce/supplier-sites/dto/response/site-supplier-table-response.dto';
import { UpdateSupplierItemSiteDto } from '@commerce/suppliers/dto/request/update-supplier-item-site.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SiteSuppliersGatewayService } from './services/site-suppliers-gateway.service';

@ApiTags('Commerce - Site Suppliers')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers')
export class SiteSuppliersGatewayController {
  private readonly logger = new Logger(SiteSuppliersGatewayController.name);

  constructor(private readonly siteSuppliersGatewayService: SiteSuppliersGatewayService) {}

  // Returns the site's enrolled suppliers for the data table with server-stored state
  @Get('table')
  @RequirePermission(SITE_SUPPLIERS.view)
  getSupplierTable(@UserId() userId: string): Promise<SiteSupplierTableResponseDto> {
    this.logger.log('GET /commerce-api/site/suppliers/table');
    return this.siteSuppliersGatewayService.findForTable(userId);
  }

  // Enrolls a supplier for the session site
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.enroll)
  enroll(@Body() dto: EnrollSiteSupplierDto): Promise<CreateResponseDto<SiteSupplierEnrollmentResponseDto>> {
    this.logger.log('POST /commerce-api/site/suppliers');
    return this.siteSuppliersGatewayService.enroll(dto);
  }

  // Returns an enrolled supplier with the site's enrollment picks
  @Get(':id')
  @RequirePermission(SITE_SUPPLIERS.view)
  findById(@Param('id') id: string): Promise<SiteSupplierResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${id}`);
    return this.siteSuppliersGatewayService.findById(id);
  }

  // Updates the site's enrollment picks for a supplier
  @Patch(':id/enrollment')
  @RequirePermission(SITE_SUPPLIERS.editEnroll)
  updateEnrollment(@Param('id') id: string, @Body() dto: UpdateSiteSupplierEnrollmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${id}/enrollment`);
    return this.siteSuppliersGatewayService.updateEnrollment(id, dto);
  }

  // Removes the site's enrollment for a supplier
  @Delete(':id/enrollment')
  @RequirePermission(SITE_SUPPLIERS.unenroll)
  unenroll(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/${id}/enrollment`);
    return this.siteSuppliersGatewayService.unenroll(id);
  }

  // Returns an enrolled supplier's items for the data table
  @Get(':id/items/table')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  getSupplierItemsTable(
    @Param('id') supplierId: string,
    @UserId() userId: string,
  ): Promise<SiteSupplierItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/table`);
    return this.siteSuppliersGatewayService.findItemsTable(supplierId, userId);
  }

  // Returns a single supplier item by ID
  @Get(':id/items/:itemId')
  @RequirePermission(SITE_SUPPLIERS.items.view)
  findItemById(@Param('id') supplierId: string, @Param('itemId') itemId: string): Promise<SiteSupplierItemResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/items/${itemId}`);
    return this.siteSuppliersGatewayService.findItemById(itemId);
  }

  // Updates this site's terms for a supplier item; the row must belong to this site (RLS)
  @Patch(':id/items/:itemId/sites/:rowId')
  @RequirePermission(SITE_SUPPLIERS.items.terms.edit)
  updateItemSite(
    @Param('id') supplierId: string,
    @Param('itemId') itemId: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateSupplierItemSiteDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/${supplierId}/items/${itemId}/sites/${rowId}`);
    return this.siteSuppliersGatewayService.updateItemSite(rowId, dto);
  }
}
