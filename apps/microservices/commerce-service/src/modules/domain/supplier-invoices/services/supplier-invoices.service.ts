import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc, or } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  parties,
  type SupplierInvoice,
  SupplierInvoiceLineTypeValues,
  SupplierInvoiceStatusValues,
  supplierInvoices,
} from '@/db/schema';
import { InvoiceableGoodsReceiptDto } from '../dto/entity/invoiceable-goods-receipt.dto';
import { PurchaseOrderInvoiceSummaryDto } from '../dto/entity/purchase-order-invoice-summary.dto';
import { SupplierInvoiceDetailDto, SupplierInvoiceDto } from '../dto/entity/supplier-invoice.dto';
import { SupplierInvoiceHoldDto } from '../dto/entity/supplier-invoice-hold.dto';
import { SupplierInvoiceLineDto } from '../dto/entity/supplier-invoice-line.dto';
import type { CreateSupplierInvoiceDto } from '../dto/request/create-supplier-invoice.dto';
import type { UpdateSupplierInvoiceDto } from '../dto/request/update-supplier-invoice.dto';
import {
  type InvoiceableGoodsReceiptFilter,
  type InvoiceableGoodsReceiptRow,
  InvoiceableGoodsReceiptsRepository,
} from '../repositories/invoiceable-goods-receipts.repository';
import { SupplierInvoiceHoldsDomainRepository } from '../repositories/supplier-invoice-holds.repository';
import { SupplierInvoiceLinesDomainRepository } from '../repositories/supplier-invoice-lines.repository';
import {
  type SupplierInvoiceRow,
  type SupplierInvoiceScope,
  SupplierInvoicesDomainRepository,
} from '../repositories/supplier-invoices.repository';

export interface SupplierInvoiceCreateContext {
  siteId?: string;
  leCurrencyCode: string;
  supplierCurrencyCode: string;
  supplierCurrencyCodes: string[];
  paymentTermId: string;
  dueDate: string;
}

export interface SupplierInvoiceInvoicingMove {
  purchaseOrderItemId: string;
  invoicedPrimaryQty: number;
}

@Injectable()
export class SupplierInvoicesDomainService {
  private readonly logger = new Logger(SupplierInvoicesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    invoiceNumber: { column: supplierInvoices.invoiceNumber, type: 'string' },
    invoiceDate: { column: supplierInvoices.invoiceDate, type: 'string' },
    taxDate: { column: supplierInvoices.taxDate, type: 'string' },
    dueDate: { column: supplierInvoices.dueDate, type: 'string' },
    status: { column: supplierInvoices.status, type: 'string' },
    paymentStatus: { column: supplierInvoices.paymentStatus, type: 'string' },
    source: { column: supplierInvoices.source, type: 'string' },
    openHoldCount: { column: supplierInvoices.openHoldCount, type: 'number' },
    supplierName: { column: parties.displayName, type: 'string' },
    sites: { column: supplierInvoices.siteId, type: 'string' },
  };

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    invoiceNumber: SupplierInvoicesDomainService.FIELD_MAP.invoiceNumber,
    supplierName: SupplierInvoicesDomainService.FIELD_MAP.supplierName,
  };

  constructor(
    private readonly repository: SupplierInvoicesDomainRepository,
    private readonly linesRepository: SupplierInvoiceLinesDomainRepository,
    private readonly holdsRepository: SupplierInvoiceHoldsDomainRepository,
    private readonly invoiceableRepository: InvoiceableGoodsReceiptsRepository,
  ) {}

  // Records a draft invoice of a supplier at a site in one of the supplier's currencies, due by its enrollment's payment term
  async create(
    dto: CreateSupplierInvoiceDto,
    context: SupplierInvoiceCreateContext,
  ): Promise<CreateResponseDto<SupplierInvoiceDto>> {
    const currencyCode = dto.currencyCode ?? context.supplierCurrencyCode;
    this.assertTradesIn(currencyCode, context.supplierCurrencyCodes);
    const exchangeRate = this.resolveExchangeRateOrThrow(currencyCode, context.leCurrencyCode, dto.exchangeRate);
    await this.assertInvoiceNumberFree(dto.supplierId, dto.invoiceNumber);

    const entity = await this.repository.create({
      siteId: context.siteId,
      supplierId: dto.supplierId,
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      taxDate: dto.taxDate ?? dto.invoiceDate,
      currencyCode,
      exchangeRate,
      paymentTermId: context.paymentTermId,
      dueDate: context.dueDate,
      status: SupplierInvoiceStatusValues.DRAFT,
      notes: dto.notes,
    });
    this.logger.log(`Created supplier invoice ${entity.invoiceNumber} (${entity.id}) at site ${context.siteId}`);
    return {
      success: true,
      message: `Invoice "${entity.invoiceNumber}" created as a draft.`,
      data: SupplierInvoiceDto.from(await this.findDetailOrThrow(entity.id)),
    };
  }

  // Updates the header of a draft or posted invoice with the due date its new date gives, in the caller's transaction
  async update(
    invoice: SupplierInvoiceRow,
    data: UpdateSupplierInvoiceDto,
    dueDate: string,
  ): Promise<SuccessResponseDto> {
    const { id, ...fields } = data;
    await this.repository.update(id, { ...fields, dueDate });
    this.logger.log(`Updated supplier invoice ${invoice.invoiceNumber} (${id})`);
    return { success: true, message: `Invoice "${fields.invoiceNumber ?? invoice.invoiceNumber}" updated.` };
  }

  // Marks a draft posted by the given user, in the caller's transaction
  async post(invoice: SupplierInvoiceRow, postedBy: string | null): Promise<void> {
    await this.repository.update(invoice.id, {
      status: SupplierInvoiceStatusValues.POSTED,
      postedBy,
      postedAt: new Date(),
    });
    this.logger.log(`Posted supplier invoice ${invoice.invoiceNumber} (${invoice.id})`);
  }

  // Marks a draft or posted invoice cancelled, in the caller's transaction
  async cancel(invoice: SupplierInvoiceRow): Promise<void> {
    await this.repository.update(invoice.id, { status: SupplierInvoiceStatusValues.CANCELLED });
    this.logger.log(`Cancelled supplier invoice ${invoice.invoiceNumber} (${invoice.id})`);
  }

  // Returns an invoice with its lines and holds; the variance and the receipt lots' MRP are in the legal entity's currency
  async findById(
    id: string,
    leCurrencyCode: string,
    scope: SupplierInvoiceScope = {},
  ): Promise<SupplierInvoiceDetailDto> {
    const invoice = await this.findDetailOrThrow(id, scope);
    const lines = await this.linesRepository.findByInvoice(id);
    const holds = (await this.holdsRepository.findByInvoice(id)).map(SupplierInvoiceHoldDto.from);
    const holdsByLine = _.groupBy(holds, (hold) => hold.supplierInvoiceLineId ?? '');
    return SupplierInvoiceDetailDto.fromDetail(
      invoice,
      lines.map((line) =>
        SupplierInvoiceLineDto.from(line, holdsByLine[line.id] ?? [], invoice.currencyCode, leCurrencyCode),
      ),
      holds,
    );
  }

  // Returns one page of the invoices a view lists — the LE's sites, one supplier or those invoicing one purchase order
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
        or(
          FilterProcessor.buildSearch(state.search, SupplierInvoicesDomainService.SEARCH_FIELD_MAP),
          this.repository.matchesPurchaseOrderNumber(state.search),
        ),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(supplierInvoices.invoiceDate), desc(supplierInvoices.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(SupplierInvoiceDto.from), count };
  }

  // Returns the posted receipt lots (or items without lots) of a supplier's orders at a site still to invoice
  async findInvoiceableGoodsReceipts(
    filter: InvoiceableGoodsReceiptFilter,
    leCurrencyCode: string,
  ): Promise<InvoiceableGoodsReceiptDto[]> {
    const rows = await this.invoiceableRepository.findInvoiceable(filter);
    return rows.map((row) => InvoiceableGoodsReceiptDto.from(row, leCurrencyCode));
  }

  // Returns the posted receipt lots (or items without lots) of a supplier's orders at a site still to invoice, with
  // their PO line's units, for invoicing them in full
  findInvoiceableGoodsReceiptRows(filter: InvoiceableGoodsReceiptFilter): Promise<InvoiceableGoodsReceiptRow[]> {
    return this.invoiceableRepository.findInvoiceable(filter);
  }

  // Returns the invoices invoicing a purchase's POs, with their purchases and whether they are a Receive with Invoice
  findForPurchase(purchaseId: string): Promise<SupplierInvoiceRow[]> {
    return this.repository.findForPurchase(purchaseId);
  }

  // Rejects a header change that repeats another invoice number of the supplier, moves the tax date of an invoice that is
  // no longer a draft, or sets a rate that does not fit the invoice's currency
  async assertUpdatable(
    invoice: SupplierInvoiceRow,
    data: UpdateSupplierInvoiceDto,
    leCurrencyCode: string,
  ): Promise<void> {
    if (data.invoiceNumber !== undefined && data.invoiceNumber !== invoice.invoiceNumber) {
      await this.assertInvoiceNumberFree(invoice.supplierId, data.invoiceNumber, data.id);
    }
    if (data.taxDate !== undefined && data.taxDate !== invoice.taxDate) {
      this.assertTaxDateEditable(invoice);
    }
    if (data.exchangeRate !== undefined) {
      this.assertExchangeRateFits(invoice.currencyCode, leCurrencyCode, data.exchangeRate);
    }
  }

  // Rejects posting a draft without lines, at a rate that does not fit, with a line on an unposted receipt, with a
  // charge but no invoiced items to land it on, or invoicing more of a receipt lot than was accepted across live invoices
  async assertPostable(invoice: SupplierInvoiceRow, leCurrencyCode: string): Promise<void> {
    if (invoice.lineCount === 0) {
      throw new BadRequestException({
        label: 'No lines',
        detail: `Add the invoiced lines to invoice "${invoice.invoiceNumber}" before posting it.`,
      });
    }
    this.assertExchangeRateFits(invoice.currencyCode, leCurrencyCode, invoice.exchangeRate);
    const unposted = await this.repository.findUnpostedReceiptNumbers(invoice.id);
    if (unposted.length > 0) {
      throw new BadRequestException({
        label: 'Receipt Not Posted',
        detail: `Post goods receipt ${unposted.join(', ')} before posting invoice "${invoice.invoiceNumber}".`,
      });
    }
    const invoicing = await this.linesRepository.findInvoicing(invoice.id);
    const lines = await this.linesRepository.findByInvoice(invoice.id);
    if (invoicing.length === 0 && lines.some((line) => line.lineType === SupplierInvoiceLineTypeValues.CHARGE)) {
      throw new BadRequestException({
        label: 'Charge Without Items',
        detail: 'A charge lands on the stock the invoice covers. Add the invoiced items before posting.',
      });
    }
    const overInvoiced = (await this.invoiceableRepository.findInvoicedByInvoice(invoice.id)).find((receipt) =>
      new Decimal(receipt.invoicedPrimaryQty).gt(receipt.acceptedPrimaryQty),
    );
    if (overInvoiced) {
      throw new ConflictException({
        label: 'Invoiced More Than Received',
        detail: `${overInvoiced.lotNumber ? `Lot ${overInvoiced.lotNumber}` : `"${overInvoiced.inventoryItemName}"`} of ${overInvoiced.grNumber} is invoiced for ${overInvoiced.invoicedPrimaryQty} primary units across live invoices, but only ${overInvoiced.acceptedPrimaryQty} were accepted.`,
      });
    }
  }

  // Returns what an invoice invoices of each PO line (invoiced + free, in primary units) for the PO line counters
  async findInvoicingMoves(supplierInvoiceId: string): Promise<SupplierInvoiceInvoicingMove[]> {
    const lines = await this.linesRepository.findInvoicing(supplierInvoiceId);
    return Object.entries(_.groupBy(lines, 'purchaseOrderItemId')).map(([purchaseOrderItemId, orderLineLines]) => ({
      purchaseOrderItemId,
      invoicedPrimaryQty: orderLineLines
        .reduce(
          (total, line) => total.plus(line.invoicedPrimaryQty ?? 0).plus(line.freePrimaryQty ?? 0),
          new Decimal(0),
        )
        .toNumber(),
    }));
  }

  // Rolls up the live invoices invoicing a purchase order and the share of its due quantity invoiced
  async summaryForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryDto> {
    return PurchaseOrderInvoiceSummaryDto.from(await this.repository.findPurchaseOrderSummary(purchaseOrderId));
  }

  // Loads an invoice in the scope with its names and line count, throwing when it is out of reach
  async findDetailOrThrow(id: string, scope: SupplierInvoiceScope = {}): Promise<SupplierInvoiceRow> {
    const invoice = await this.repository.findDetail(id, scope);
    if (!invoice) throw new NotFoundException('Supplier invoice not found.');
    return invoice;
  }

  // A cancelled invoice is history: its lines, holds and costs no longer change
  async findEditableOrThrow(id: string): Promise<SupplierInvoiceRow> {
    const invoice = await this.findDetailOrThrow(id);
    if (invoice.status !== SupplierInvoiceStatusValues.CANCELLED) return invoice;
    throw new BadRequestException({
      label: 'Invoice cancelled',
      detail: `Invoice "${invoice.invoiceNumber}" is cancelled and can no longer be changed.`,
    });
  }

  // Only a draft is posted or deleted; a posted invoice is edited in place or cancelled
  async findDraftOrThrow(id: string, action: 'post' | 'delete'): Promise<SupplierInvoiceRow> {
    const invoice = await this.findDetailOrThrow(id);
    if (invoice.status === SupplierInvoiceStatusValues.DRAFT) return invoice;
    const status = invoice.status.toLowerCase();
    const detail =
      action === 'post'
        ? `Invoice "${invoice.invoiceNumber}" is already ${status}.`
        : `Invoice "${invoice.invoiceNumber}" is ${status}; cancel it instead of deleting it.`;
    throw new BadRequestException({ label: 'Invoice is not a draft', detail });
  }

  // Deletes a draft invoice with its lines and holds
  async delete(invoice: SupplierInvoiceRow): Promise<SuccessResponseDto> {
    await this.repository.delete(invoice.id);
    this.logger.log(`Deleted supplier invoice ${invoice.invoiceNumber} (${invoice.id})`);
    return { success: true, message: `Invoice "${invoice.invoiceNumber}" deleted.` };
  }

  // Rejects a tax date change on an invoice that is no longer a draft
  private assertTaxDateEditable(invoice: Pick<SupplierInvoice, 'invoiceNumber' | 'status'>): void {
    if (invoice.status === SupplierInvoiceStatusValues.DRAFT) return;
    throw new BadRequestException({
      label: 'Tax Date Locked',
      detail: `Invoice "${invoice.invoiceNumber}" is ${invoice.status.toLowerCase()}; its tax date can change only while it is a draft.`,
      errors: [{ field: 'taxDate', message: 'Locked once posted' }],
    });
  }

  // A supplier numbers its invoices uniquely, so a repeated number is the same invoice entered twice
  private async assertInvoiceNumberFree(supplierId: string, invoiceNumber: string, excludeId?: string): Promise<void> {
    const isTaken = await this.repository.isInvoiceNumberTaken(supplierId, invoiceNumber, excludeId);
    if (!isTaken) return;
    throw new ConflictException({
      label: 'Invoice already entered',
      detail: `This supplier already has an invoice numbered "${invoiceNumber}".`,
      errors: [{ field: 'invoiceNumber', message: 'Already entered for this supplier' }],
    });
  }

  // Rejects a currency the supplier does not trade in
  private assertTradesIn(currencyCode: string, supplierCurrencies: string[]): void {
    if (supplierCurrencies.includes(currencyCode)) return;
    throw new ValidationException({
      label: 'Currency Not Accepted',
      detail: `This supplier trades in ${supplierCurrencies.join(', ')}, not ${currencyCode}.`,
      errors: [{ field: 'currencyCode', message: "Not one of the supplier's currencies" }],
    });
  }

  // Returns the rate an invoice stores: 1 in the legal entity's own currency, the given one in any other
  private resolveExchangeRateOrThrow(
    currencyCode: string,
    leCurrencyCode: string,
    exchangeRate: number | undefined,
  ): number {
    if (currencyCode === leCurrencyCode) return 1;
    if (exchangeRate !== undefined) return exchangeRate;
    throw new ValidationException({
      label: 'Exchange Rate Required',
      detail: `The invoice is in ${currencyCode}; enter how much 1 ${currencyCode} is in ${leCurrencyCode}.`,
      errors: [{ field: 'exchangeRate', message: `1 ${currencyCode} in ${leCurrencyCode}` }],
    });
  }

  // An invoice in the legal entity's own currency converts at 1; only a foreign-currency invoice takes another rate
  private assertExchangeRateFits(currencyCode: string, leCurrencyCode: string, exchangeRate: number): void {
    if (currencyCode !== leCurrencyCode || exchangeRate === 1) return;
    throw new BadRequestException({
      label: 'Exchange rate is 1',
      detail: `The invoice is in ${leCurrencyCode}, the legal entity's currency, so its exchange rate is always 1.`,
      errors: [{ field: 'exchangeRate', message: 'Must be 1' }],
    });
  }
}
