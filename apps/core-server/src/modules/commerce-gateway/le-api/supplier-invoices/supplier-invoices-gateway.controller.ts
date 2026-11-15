import { LeCreateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/le-create-supplier-invoice.dto';
import { LeInvoiceableGoodsReceiptsQueryDto } from '@commerce/supplier-invoices/dto/request/le-invoiceable-goods-receipts-query.dto';
import { ReleaseSupplierInvoiceHoldDto } from '@commerce/supplier-invoices/dto/request/release-supplier-invoice-hold.dto';
import { SupplierInvoiceLineDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-line.dto';
import { SupplierInvoiceSiteParamsDto } from '@commerce/supplier-invoices/dto/request/supplier-invoice-site-params.dto';
import { UpdateSupplierInvoiceDto } from '@commerce/supplier-invoices/dto/request/update-supplier-invoice.dto';
import type { InvoiceableGoodsReceiptResponseDto } from '@commerce/supplier-invoices/dto/response/invoiceable-goods-receipt-response.dto';
import type {
  SupplierInvoiceDetailResponseDto,
  SupplierInvoiceResponseDto,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import type { SupplierInvoiceTableResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-table-response.dto';
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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_SUPPLIER_INVOICES } from '@vritti/commerce-permissions/supplier-invoices';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiCancelSupplierInvoice,
  ApiCreateSupplierInvoice,
  ApiCreateSupplierInvoiceLine,
  ApiDeleteSupplierInvoice,
  ApiDeleteSupplierInvoiceLine,
  ApiFindForTableSupplierInvoices,
  ApiFindSupplierInvoiceById,
  ApiFindSupplierInvoiceInvoiceableGoodsReceipts,
  ApiPostSupplierInvoice,
  ApiReleaseSupplierInvoiceHold,
  ApiUpdateSupplierInvoice,
  ApiUpdateSupplierInvoiceLine,
} from './docs/supplier-invoices-gateway.docs';
import { SupplierInvoicesGatewayService } from './services/supplier-invoices-gateway.service';

@ApiTags('Commerce - Supplier Invoices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_SUPPLIER_INVOICES.featureCode)
@Controller('le/supplier-invoices')
export class SupplierInvoicesGatewayController {
  private readonly logger = new Logger(SupplierInvoicesGatewayController.name);

  constructor(private readonly service: SupplierInvoicesGatewayService) {}

  // Records a draft invoice of a supplier at one of the legal entity's sites
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIER_INVOICES.add)
  @ApiCreateSupplierInvoice()
  create(@Body() dto: LeCreateSupplierInvoiceDto): Promise<CreateResponseDto<SupplierInvoiceResponseDto>> {
    this.logger.log('POST /commerce-api/le/supplier-invoices');
    return this.service.create(dto);
  }

  // Adds an item line invoicing a received lot, or a charge line, to an invoice
  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiCreateSupplierInvoiceLine()
  createLine(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SupplierInvoiceLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/supplier-invoices/${id}/lines`);
    return this.service.createLine(id, dto);
  }

  // Updates an invoice's header
  @Patch(':id')
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiUpdateSupplierInvoice()
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSupplierInvoiceDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/supplier-invoices/${id}`);
    return this.service.update(id, dto);
  }

  // Updates a line of an invoice
  @Patch(':id/lines/:lineId')
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiUpdateSupplierInvoiceLine()
  updateLine(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
    @Body() dto: SupplierInvoiceLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/supplier-invoices/${id}/lines/${lineId}`);
    return this.service.updateLine(id, lineId, dto);
  }

  // Posts a draft invoice, setting the final cost of the stock it invoices
  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiPostSupplierInvoice()
  post(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/supplier-invoices/${id}/post`);
    return this.service.post(id);
  }

  // Cancels an invoice, reversing its costing and the order's invoiced quantities when it was posted
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiCancelSupplierInvoice()
  cancel(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/supplier-invoices/${id}/cancel`);
    return this.service.cancel(id);
  }

  // Releases an open hold of an invoice with a reason
  @Post(':id/holds/:holdId/release')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiReleaseSupplierInvoiceHold()
  releaseHold(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('holdId', new ParseUUIDPipe()) holdId: string,
    @Body() dto: ReleaseSupplierInvoiceHoldDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/le/supplier-invoices/${id}/holds/${holdId}/release`);
    return this.service.releaseHold(id, holdId, dto);
  }

  // Returns an invoice with its lines and holds
  @Get(':id')
  @RequirePermission(LE_SUPPLIER_INVOICES.view)
  @ApiFindSupplierInvoiceById()
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @OrgId() orgId: string,
  ): Promise<SupplierInvoiceDetailResponseDto> {
    this.logger.log(`GET /commerce-api/le/supplier-invoices/${id}`);
    return this.service.findById(id, orgId);
  }

  // Returns the invoices of the legal entity's sites for the data table
  @Get('table')
  @RequirePermission(LE_SUPPLIER_INVOICES.view)
  @ApiFindForTableSupplierInvoices()
  findForTable(@UserId() userId: string, @OrgId() orgId: string): Promise<SupplierInvoiceTableResponseDto> {
    this.logger.log('GET /commerce-api/le/supplier-invoices/table');
    return this.service.findForTable(userId, orgId);
  }

  // Returns a supplier's posted receipt lots at one of the legal entity's sites still to invoice, for an invoice's line picker
  @Get('invoiceable-goods-receipts/sites/:siteId')
  @RequirePermission(LE_SUPPLIER_INVOICES.view)
  @ApiFindSupplierInvoiceInvoiceableGoodsReceipts()
  findInvoiceableGoodsReceipts(
    @Param() { siteId }: SupplierInvoiceSiteParamsDto,
    @Query() query: LeInvoiceableGoodsReceiptsQueryDto,
  ): Promise<InvoiceableGoodsReceiptResponseDto[]> {
    this.logger.log(`GET /commerce-api/le/supplier-invoices/invoiceable-goods-receipts/sites/${siteId}`);
    return this.service.findInvoiceableGoodsReceipts(siteId, query);
  }

  // Deletes a draft invoice
  @Delete(':id')
  @RequirePermission(LE_SUPPLIER_INVOICES.delete)
  @ApiDeleteSupplierInvoice()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/supplier-invoices/${id}`);
    return this.service.delete(id);
  }

  // Removes a line from an invoice
  @Delete(':id/lines/:lineId')
  @RequirePermission(LE_SUPPLIER_INVOICES.edit)
  @ApiDeleteSupplierInvoiceLine()
  deleteLine(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/supplier-invoices/${id}/lines/${lineId}`);
    return this.service.deleteLine(id, lineId);
  }
}
