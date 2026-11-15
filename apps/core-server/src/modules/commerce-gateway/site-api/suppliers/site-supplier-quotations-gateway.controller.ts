import type { SupplierQuotationDetailResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { Controller, Get, Logger, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { SiteSupplierQuotationsGatewayService } from './services/site-supplier-quotations-gateway.service';

// A supplier's quotations posted to the session site, read-only
@ApiTags('Commerce - Site Supplier Quotations')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers/:id/quotations')
export class SiteSupplierQuotationsGatewayController {
  private readonly logger = new Logger(SiteSupplierQuotationsGatewayController.name);

  constructor(private readonly service: SiteSupplierQuotationsGatewayService) {}

  // Returns a quotation posted to the session site, with its lines and posted sites
  @Get(':quotationId')
  @RequirePermission(SITE_SUPPLIERS.quotations.view)
  findById(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierQuotationDetailResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/quotations/${quotationId}`);
    return this.service.findById(supplierId, quotationId, orgId);
  }

  // Returns the supplier's quotations posted to the session site for the data table
  @Get('table')
  @RequirePermission(SITE_SUPPLIERS.quotations.view)
  getTable(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @UserId() userId: string,
  ): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/quotations/table`);
    return this.service.findForTable(supplierId, userId);
  }
}
