import { AddSupplierQuotationItemDto } from '@commerce/supplier-quotations/dto/request/add-supplier-quotation-item.dto';
import { CreateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/create-supplier-quotation.dto';
import { SupplierQuotationItemFieldsDto } from '@commerce/supplier-quotations/dto/request/supplier-quotation-item-fields.dto';
import { UpdateSupplierQuotationDto } from '@commerce/supplier-quotations/dto/request/update-supplier-quotation.dto';
import type { SupplierQuotationCountsResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-counts-response.dto';
import type {
  SupplierQuotationDetailResponseDto,
  SupplierQuotationResponseDto,
} from '@commerce/supplier-quotations/dto/response/supplier-quotation-response.dto';
import type { SupplierQuotationTableResponseDto } from '@commerce/supplier-quotations/dto/response/supplier-quotation-table-response.dto';
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
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { ApiFindSiteSupplierQuotationCounts } from './docs/site-suppliers-gateway.docs';
import { SiteSupplierQuotationsGatewayService } from './services/site-supplier-quotations-gateway.service';

// A supplier's quotations at the session site: the site's own, which it writes and posts here, and those posted to it,
// which it reads and can remove
@ApiTags('Commerce - Site Supplier Quotations')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_SUPPLIERS.featureCode)
@Controller('site/suppliers/:id/quotations')
export class SiteSupplierQuotationsGatewayController {
  private readonly logger = new Logger(SiteSupplierQuotationsGatewayController.name);

  constructor(private readonly service: SiteSupplierQuotationsGatewayService) {}

  // Records a draft quotation of the supplier the session site owns
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.quotations.add)
  create(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Body() dto: CreateSupplierQuotationDto,
  ): Promise<CreateResponseDto<SupplierQuotationResponseDto>> {
    this.logger.log(`POST /commerce-api/site/suppliers/${supplierId}/quotations`);
    return this.service.create(supplierId, dto);
  }

  // Adds a line to a draft quotation the session site owns
  @Post(':quotationId/items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.quotations.edit)
  addItem(
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
    @Body() dto: AddSupplierQuotationItemDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/suppliers/quotations/${quotationId}/items`);
    return this.service.addItem(quotationId, dto);
  }

  // Changes the header of a quotation the session site owns
  @Patch(':quotationId')
  @RequirePermission(SITE_SUPPLIERS.quotations.edit)
  update(
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
    @Body() dto: UpdateSupplierQuotationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/quotations/${quotationId}`);
    return this.service.update(quotationId, dto);
  }

  // Changes a line of a draft quotation the session site owns
  @Patch(':quotationId/items/:itemId')
  @RequirePermission(SITE_SUPPLIERS.quotations.edit)
  updateItem(
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: SupplierQuotationItemFieldsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/suppliers/quotations/${quotationId}/items/${itemId}`);
    return this.service.updateItem(quotationId, itemId, dto);
  }

  // Posts a quotation the session site owns to the site, writing its lines as the site's prices
  @Post(':quotationId/posting')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(SITE_SUPPLIERS.quotations.post)
  post(@Param('quotationId', new ParseUUIDPipe()) quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/suppliers/quotations/${quotationId}/posting`);
    return this.service.post(quotationId);
  }

  // Returns a quotation the session site can read, with its lines and posted sites
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

  // Returns the supplier's quotations the session site can read, for the data table
  @Get('table')
  @RequirePermission(SITE_SUPPLIERS.quotations.view)
  getTable(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @UserId() userId: string,
    @OrgId() orgId: string,
  ): Promise<SupplierQuotationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/quotations/table`);
    return this.service.findForTable(supplierId, userId, orgId);
  }

  // Counts the lines and postings of a quotation the session site can read, one per tab of its page
  @Get(':quotationId/counts')
  @RequirePermission(SITE_SUPPLIERS.quotations.view)
  @ApiFindSiteSupplierQuotationCounts()
  findCounts(
    @Param('id', new ParseUUIDPipe()) supplierId: string,
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
  ): Promise<SupplierQuotationCountsResponseDto> {
    this.logger.log(`GET /commerce-api/site/suppliers/${supplierId}/quotations/${quotationId}/counts`);
    return this.service.findCounts(supplierId, quotationId);
  }

  // Deletes a quotation the session site owns while it is posted nowhere else
  @Delete(':quotationId')
  @RequirePermission(SITE_SUPPLIERS.quotations.delete)
  delete(@Param('quotationId', new ParseUUIDPipe()) quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/quotations/${quotationId}`);
    return this.service.delete(quotationId);
  }

  // Removes a line from a draft quotation the session site owns
  @Delete(':quotationId/items/:itemId')
  @RequirePermission(SITE_SUPPLIERS.quotations.edit)
  removeItem(
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/quotations/${quotationId}/items/${itemId}`);
    return this.service.removeItem(quotationId, itemId);
  }

  // Removes a quotation posted to the session site, whoever owns it, with its prices here
  @Delete(':quotationId/posting')
  @RequirePermission(SITE_SUPPLIERS.quotations.remove)
  remove(@Param('quotationId', new ParseUUIDPipe()) quotationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/suppliers/quotations/${quotationId}/posting`);
    return this.service.remove(quotationId);
  }
}
