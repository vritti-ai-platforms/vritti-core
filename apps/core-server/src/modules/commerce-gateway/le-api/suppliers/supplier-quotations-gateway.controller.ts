import { AddSupplierQuotationItemDto } from '@commerce/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import { CreateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/create-supplier-quotation.dto';
import { PostSupplierQuotationSiteDto } from '@commerce/supplier-quotations/dto/request/post-supplier-quotation-site.dto';
import { SupplierQuotationItemFieldsDto } from '@commerce/supplier-quotations/dto/request/supplier-quotation-item-fields.dto';
import { UpdateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/update-supplier-quotation.dto';
import type {
  SupplierQuotationDetailResponseDto,
  SupplierQuotationResponseDto,
} from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId, OrgId } from '@/security/decorators';
import { SupplierQuotationsGatewayService } from './services/supplier-quotations-gateway.service';

@ApiTags('Commerce - Supplier Quotations')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_SUPPLIERS.featureCode)
@Controller('le/suppliers/:id/quotations')
export class SupplierQuotationsGatewayController {
  private readonly logger = new Logger(SupplierQuotationsGatewayController.name);

  constructor(private readonly service: SupplierQuotationsGatewayService) {}

  // Returns a supplier's quotations for the data table
  @Get('table')
  @RequirePermission(LE_SUPPLIERS.quotations.view)
  getTable(@Param('id') supplierId: string, @UserId() userId: string): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/${supplierId}/quotations/table`);
    return this.service.findForTable(supplierId, userId);
  }

  // Records a supplier's quotation as a draft
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.quotations.add)
  create(
    @Param('id') supplierId: string,
    @Body() dto: CreateSupplierQuotationDto,
  ): Promise<CreateResponseDto<SupplierQuotationResponseDto>> {
    this.logger.log(`POST /commerce-api/le/suppliers/${supplierId}/quotations`);
    return this.service.create(supplierId, dto);
  }

  // Returns a quotation with its lines and posted sites
  @Get(':quotationId')
  @RequirePermission(LE_SUPPLIERS.quotations.view)
  findById(
    @Param('quotationId') quotationId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierQuotationDetailResponseDto> {
    this.logger.log(`GET /commerce-api/le/suppliers/quotations/${quotationId}`);
    return this.service.findById(quotationId, orgId);
  }

  // Updates a quotation's header
  @Patch(':quotationId')
  @RequirePermission(LE_SUPPLIERS.quotations.edit)
  update(
    @Param('quotationId') quotationId: string,
    @Body() dto: UpdateSupplierQuotationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/quotations/${quotationId}`);
    return this.service.update(quotationId, dto);
  }

  // Deletes a quotation, removing it from every site first
  @Delete(':quotationId')
  @RequirePermission(LE_SUPPLIERS.quotations.delete)
  delete(@Param('quotationId') quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/quotations/${quotationId}`);
    return this.service.delete(quotationId);
  }

  // Adds a line to a draft quotation
  @Post(':quotationId/items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.quotations.edit)
  addItem(
    @Param('quotationId') quotationId: string,
    @Body() dto: AddSupplierQuotationItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/suppliers/quotations/${quotationId}/items`);
    return this.service.addItem(quotationId, dto);
  }

  // Updates a line of a draft quotation
  @Patch(':quotationId/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.quotations.edit)
  updateItem(
    @Param('quotationId') quotationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: SupplierQuotationItemFieldsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/suppliers/quotations/${quotationId}/items/${itemId}`);
    return this.service.updateItem(quotationId, itemId, dto);
  }

  // Removes a line from a draft quotation
  @Delete(':quotationId/items/:itemId')
  @RequirePermission(LE_SUPPLIERS.quotations.edit)
  removeItem(@Param('quotationId') quotationId: string, @Param('itemId') itemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/quotations/${quotationId}/items/${itemId}`);
    return this.service.removeItem(quotationId, itemId);
  }

  // Posts the quotation to a site, writing its lines as the site's prices
  @Post(':quotationId/sites')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIERS.sites.quotations.add)
  postToSite(
    @Param('quotationId') quotationId: string,
    @Body() dto: PostSupplierQuotationSiteDto,
    @OrgId() orgId: string,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/suppliers/quotations/${quotationId}/sites`);
    return this.service.postToSite(quotationId, dto.siteId, orgId, legalEntityId);
  }

  // Removes the quotation from a site, deleting its prices there and restoring the earlier ones
  @Delete(':quotationId/sites/:siteId')
  @RequirePermission(LE_SUPPLIERS.sites.quotations.delete)
  removeFromSite(
    @Param('quotationId') quotationId: string,
    @Param('siteId') siteId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/suppliers/quotations/${quotationId}/sites/${siteId}`);
    return this.service.removeFromSite(quotationId, siteId);
  }
}
