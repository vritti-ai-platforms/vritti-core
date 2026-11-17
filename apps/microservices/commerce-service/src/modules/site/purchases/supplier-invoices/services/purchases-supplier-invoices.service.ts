import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { CreatePurchaseSupplierInvoiceDto } from '@domain/purchases/dto/request/create-purchase-supplier-invoice.dto';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import type { SupplierInvoiceDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import type { InvoiceableGoodsReceiptRow } from '@domain/supplier-invoices/repositories/invoiceable-goods-receipts.repository';
import { SupplierInvoiceHoldsDomainService } from '@domain/supplier-invoices/services/supplier-invoice-holds.service';
import {
  type PreparedSupplierInvoiceLine,
  SupplierInvoiceLinesDomainService,
} from '@domain/supplier-invoices/services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { PurchaseOrderStatusValues, SupplierInvoiceLineTypeValues } from '@/db/schema';
import { PurchaseProgressService } from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { SupplierInvoicesService } from '@/modules/site/suppliers/invoices/root/services/supplier-invoices.service';

export interface PurchaseSupplierInvoiceSite {
  siteId?: string;
  leCurrencyCode: string;
}

interface InvoicedLeg {
  purchase: PurchaseRow;
  leg: PurchaseSupplierRow;
  receipts: InvoiceableGoodsReceiptRow[];
}

@Injectable()
export class PurchasesSupplierInvoicesService {
  private readonly logger = new Logger(PurchasesSupplierInvoicesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly invoicesService: SupplierInvoicesDomainService,
    private readonly invoiceLinesService: SupplierInvoiceLinesDomainService,
    private readonly holdsService: SupplierInvoiceHoldsDomainService,
    private readonly supplierInvoicesService: SupplierInvoicesService,
    private readonly progressService: PurchaseProgressService,
  ) {}

  // Drafts the supplier's invoice of everything received and not yet invoiced on its open legs at the site that are
  // invoiced on their own (only the named purchases when given), in the invoice's currency: one line per posted receipt
  // lot (or item without lots) at its PO line's price for all of its open accepted quantity
  async create(
    dto: CreatePurchaseSupplierInvoiceDto,
    site: PurchaseSupplierInvoiceSite,
  ): Promise<CreateResponseDto<{ supplierInvoiceId: string }>> {
    const invoicedLegs = await this.findInvoicedLegs(dto, site.siteId);
    const { purchaseIds, ...invoice } = dto;

    const created = await this.database.runInTransaction(async () => {
      const { data } = await this.supplierInvoicesService.create(invoice, {
        siteId: site.siteId,
        leCurrencyCode: site.leCurrencyCode,
      });
      for (const invoiced of invoicedLegs) await this.addLines(data, invoiced.receipts);
      await this.holdsService.sync(data.id, site.leCurrencyCode);
      for (const invoiced of invoicedLegs) await this.progressService.syncLegStep(invoiced.purchase, invoiced.leg);
      return data;
    });
    const lineCount = invoicedLegs.reduce((count, invoiced) => count + invoiced.receipts.length, 0);
    this.logger.log(
      `purchases.supplierInvoices.create — ${created.invoiceNumber}, lines: ${lineCount}, purchases: ${purchaseIds?.length ?? 'all'}`,
    );
    return {
      success: true,
      message: `Supplier invoice "${created.invoiceNumber}" drafted with ${pluralize('line', lineCount, true)} across ${pluralize('purchase', invoicedLegs.length, true)}.`,
      data: { supplierInvoiceId: created.id },
    };
  }

  // Finds the supplier's legs invoiced on their own with posted receipts of their live POs in the invoice's currency
  // still to invoice, rejecting an invoice with nothing to invoice
  private async findInvoicedLegs(dto: CreatePurchaseSupplierInvoiceDto, siteId?: string): Promise<InvoicedLeg[]> {
    const legs = await this.legsService.findFulfillingForSupplierAtSite(
      dto.supplierId,
      PurchaseSuppliersDomainService.SUPPLIER_INVOICE_TYPES,
      dto.purchaseIds,
      siteId,
    );
    const [invoiceable, purchases] = await Promise.all([
      this.invoicesService.findInvoiceableGoodsReceiptRows({ supplierId: dto.supplierId, siteId }),
      this.purchasesRepository.findDetailsByIds(_.uniq(legs.map((leg) => leg.purchaseId))),
    ]);
    const purchasesById = _.keyBy(purchases, 'id');
    const invoicedLegs = legs.flatMap((leg): InvoicedLeg[] => {
      const receipts = invoiceable.filter(
        (row) =>
          row.purchaseId === leg.purchaseId &&
          row.poStatus !== PurchaseOrderStatusValues.CANCELLED &&
          row.poCurrencyCode === dto.currencyCode &&
          this.invoicedQtyOf(row).gt(0),
      );
      const purchase = purchasesById[leg.purchaseId];
      return receipts.length > 0 && purchase ? [{ purchase, leg, receipts }] : [];
    });
    if (invoicedLegs.length > 0) return invoicedLegs;
    throw new BadRequestException({
      label: 'Nothing to Invoice',
      detail: `Nothing received from this supplier on its open purchases at this site is left to invoice in ${dto.currencyCode}.`,
    });
  }

  // Adds one item line per receipt lot (or item without lots) for what is still open of it, in the caller's transaction
  private async addLines(invoice: SupplierInvoiceDto, receipts: InvoiceableGoodsReceiptRow[]): Promise<void> {
    const lines: PreparedSupplierInvoiceLine[] = [];
    for (const receipt of receipts) {
      const line = await this.invoiceLinesService.prepare(invoice, {
        lineType: SupplierInvoiceLineTypeValues.ITEM,
        purchaseOrderItemId: receipt.purchaseOrderItemId,
        goodsReceiptItemId: receipt.goodsReceiptItemId,
        goodsReceiptLotId: receipt.goodsReceiptLotId,
        invoicedQty: this.invoicedQtyOf(receipt).toNumber(),
        freeQty: 0,
        unitPrice: CurrencyAmountDto.from(receipt.poUnitPrice, receipt.poCurrencyCode),
      });
      lines.push(line);
    }
    await this.invoiceLinesService.createMany(invoice, lines);
  }

  // Converts what is still open to invoice of a receipt lot to its PO line's unit, rounded down so it never invoices more
  private invoicedQtyOf(receipt: InvoiceableGoodsReceiptRow): Decimal {
    return new Decimal(receipt.acceptedPrimaryQty)
      .minus(receipt.invoicedPrimaryQty)
      .times(receipt.poUomQty)
      .dividedBy(receipt.poPrimaryUomQty)
      .toDecimalPlaces(3, Decimal.ROUND_DOWN);
  }
}
