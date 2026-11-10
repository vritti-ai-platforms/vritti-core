import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { parties, purchaseOrders, SupplierInvoiceStatusValues, supplierInvoices } from '@/db/schema';
import { PurchaseOrderInvoiceFlagsDto } from '../dto/entity/purchase-order-invoice-flags.dto';
import { PurchaseOrderInvoiceSummaryDto } from '../dto/entity/purchase-order-invoice-summary.dto';
import { SupplierInvoiceDetailDto, SupplierInvoiceDto } from '../dto/entity/supplier-invoice.dto';
import { SupplierInvoiceLineDto } from '../dto/entity/supplier-invoice-line.dto';
import type { CreateSupplierInvoiceDto } from '../dto/request/create-supplier-invoice.dto';
import type { UpdateSupplierInvoiceDto } from '../dto/request/update-supplier-invoice.dto';
import { SupplierInvoiceLineReceiptsDomainRepository } from '../repositories/supplier-invoice-line-receipts.repository';
import { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';
import {
  type SupplierInvoiceScope,
  SupplierInvoicesDomainRepository,
} from '../repositories/supplier-invoices.repository';
import { SupplierInvoiceCostingDomainService } from './supplier-invoice-costing.service';
import { SupplierInvoiceMatchDomainService } from './supplier-invoice-match.service';

@Injectable()
export class SupplierInvoicesDomainService {
  private readonly logger = new Logger(SupplierInvoicesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    invoiceNumber: { column: supplierInvoices.invoiceNumber, type: 'string' },
    invoiceDate: { column: supplierInvoices.invoiceDate, type: 'string' },
    taxDate: { column: supplierInvoices.taxDate, type: 'string' },
    status: { column: supplierInvoices.status, type: 'string' },
    flagCount: { column: supplierInvoices.flagCount, type: 'number' },
    supplierName: { column: parties.displayName, type: 'string' },
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    sites: { column: supplierInvoices.siteId, type: 'string' },
  };

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    invoiceNumber: SupplierInvoicesDomainService.FIELD_MAP.invoiceNumber,
    supplierName: SupplierInvoicesDomainService.FIELD_MAP.supplierName,
    poNumber: SupplierInvoicesDomainService.FIELD_MAP.poNumber,
  };

  constructor(
    private readonly repository: SupplierInvoicesDomainRepository,
    private readonly linesRepository: SupplierInvoiceLinesDomainRepository,
    private readonly receiptsRepository: SupplierInvoiceLineReceiptsDomainRepository,
    private readonly matchService: SupplierInvoiceMatchDomainService,
    private readonly costingService: SupplierInvoiceCostingDomainService,
  ) {}

  // Returns one page of the invoices a view lists — the LE's sites, one supplier or one purchase order
  async findForTable(
    state: TableState,
    scope: SupplierInvoiceScope = {},
  ): Promise<{ result: SupplierInvoiceDto[]; count: number }> {
    const fieldMap = SupplierInvoicesDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findForTable(scope, {
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, SupplierInvoicesDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(supplierInvoices.invoiceDate), desc(supplierInvoices.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(SupplierInvoiceDto.from), count };
  }

  // Returns an invoice with its lines, their flags and the receipts each line is linked to; the variance is in the
  // legal entity's currency
  async findById(
    id: string,
    leCurrencyCode: string,
    scope: SupplierInvoiceScope = {},
  ): Promise<SupplierInvoiceDetailDto> {
    const invoice = await this.repository.findDetailOrThrow(id, scope);
    const lines = await this.linesRepository.findByInvoice(id);
    const receiptsByLine = _.groupBy(
      await this.receiptsRepository.findByLineIds(lines.map((line) => line.id)),
      'supplierInvoiceLineId',
    );
    return SupplierInvoiceDetailDto.fromDetail(
      invoice,
      lines.map((line) =>
        SupplierInvoiceLineDto.from(line, receiptsByLine[line.id] ?? [], invoice.currencyCode, leCurrencyCode),
      ),
    );
  }

  // Records a draft invoice billing a confirmed purchase order; supplier, site, legal entity, currency and rate are the order's
  async create(
    data: CreateSupplierInvoiceDto,
    createdBy: string | null,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    const purchaseOrder = await this.repository.findInvoiceablePurchaseOrderOrThrow(data.purchaseOrderId);
    await this.repository.assertInvoiceNumberFree(purchaseOrder.supplierId, data.invoiceNumber);
    const entity = await this.repository.create({
      legalEntityId: purchaseOrder.legalEntityId,
      siteId: purchaseOrder.siteId,
      supplierId: purchaseOrder.supplierId,
      purchaseOrderId: purchaseOrder.id,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      taxDate: data.taxDate ?? data.invoiceDate,
      currencyCode: purchaseOrder.currencyCode,
      exchangeRate: purchaseOrder.exchangeRate,
      status: SupplierInvoiceStatusValues.DRAFT,
      notes: data.notes ?? null,
      createdBy,
    });
    this.logger.log(`Created supplier invoice ${entity.invoiceNumber} (${entity.id}) for PO ${purchaseOrder.poNumber}`);
    return {
      success: true,
      message: `Invoice "${entity.invoiceNumber}" created as a draft.`,
      data: SupplierInvoiceDto.from(await this.repository.findDetailOrThrow(entity.id)),
    };
  }

  // Updates the header of a draft or posted invoice; a posted one is re-costed at the edited rate, and every change rematches
  async update(data: UpdateSupplierInvoiceDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const { id, ...fields } = data;
    const invoice = await this.repository.findEditableOrThrow(id);
    if (fields.invoiceNumber !== undefined && fields.invoiceNumber !== invoice.invoiceNumber) {
      await this.repository.assertInvoiceNumberFree(invoice.supplierId, fields.invoiceNumber, id);
    }
    if (fields.taxDate !== undefined && fields.taxDate !== invoice.taxDate) {
      this.repository.assertTaxDateEditable(invoice);
    }
    if (fields.exchangeRate !== undefined) {
      this.repository.assertExchangeRateFits(invoice.currencyCode, leCurrencyCode, fields.exchangeRate);
    }
    await this.repository.transaction(() =>
      this.costingService.withRecosting(invoice, leCurrencyCode, async () => {
        await this.repository.update(id, fields);
        await this.matchService.rematch(invoice.purchaseOrderId);
      }),
    );
    this.logger.log(`Updated supplier invoice ${invoice.invoiceNumber} (${id})`);
    return { success: true, message: `Invoice "${fields.invoiceNumber ?? invoice.invoiceNumber}" updated.` };
  }

  // Posts a draft with lines, setting the final cost of the stock it bills
  async post(id: string, leCurrencyCode: string, postedBy: string | null): Promise<SuccessResponseDto> {
    const invoice = await this.repository.findDraftOrThrow(id, 'post');
    if (invoice.lineCount === 0) {
      throw new BadRequestException({
        label: 'No lines',
        detail: `Add the billed lines to invoice "${invoice.invoiceNumber}" before posting it.`,
      });
    }
    this.repository.assertExchangeRateFits(invoice.currencyCode, leCurrencyCode, invoice.exchangeRate);
    await this.repository.transaction(async () => {
      await this.repository.update(id, { status: SupplierInvoiceStatusValues.POSTED, postedBy, postedAt: new Date() });
      await this.costingService.revalue(id, leCurrencyCode, 'apply');
    });
    this.logger.log(`Posted supplier invoice ${invoice.invoiceNumber} (${id})`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" posted.` };
  }

  // Cancels a draft or posted invoice; a posted one's costing is reversed, and the order's other invoices rematch
  async cancel(id: string, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const invoice = await this.repository.findEditableOrThrow(id);
    await this.repository.transaction(async () => {
      if (invoice.status === SupplierInvoiceStatusValues.POSTED) {
        await this.costingService.revalue(id, leCurrencyCode, 'reverse');
      }
      await this.repository.update(id, { status: SupplierInvoiceStatusValues.CANCELLED });
      await this.matchService.rematch(invoice.purchaseOrderId);
    });
    this.logger.log(`Cancelled supplier invoice ${invoice.invoiceNumber} (${id})`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" cancelled.` };
  }

  // Deletes a draft invoice with its lines and links, and rematches the order's other invoices
  async delete(id: string): Promise<SuccessResponseDto> {
    const invoice = await this.repository.findDraftOrThrow(id, 'delete');
    await this.repository.transaction(async () => {
      await this.repository.delete(id);
      await this.matchService.rematch(invoice.purchaseOrderId);
    });
    this.logger.log(`Deleted supplier invoice ${invoice.invoiceNumber} (${id})`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" deleted.` };
  }

  // Returns a purchase order's flagged live invoices, newest first, with their header flags and flagged lines in line order
  async findFlaggedForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderInvoiceFlagsDto[]> {
    const invoices = await this.repository.findFlaggedForPurchaseOrder(purchaseOrderId);
    const linesByInvoice = _.groupBy(
      await this.linesRepository.findFlaggedForPurchaseOrder(purchaseOrderId),
      'supplierInvoiceId',
    );
    return invoices.map((invoice) => PurchaseOrderInvoiceFlagsDto.from(invoice, linesByInvoice[invoice.id] ?? []));
  }

  // Rolls a purchase order's live invoices up into counts and the share of the ordered quantity billed
  async summaryForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryDto> {
    return PurchaseOrderInvoiceSummaryDto.from(await this.repository.findPurchaseOrderSummary(purchaseOrderId));
  }
}
