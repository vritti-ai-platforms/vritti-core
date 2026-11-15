import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { CreatePurchaseSupplierInvoiceDto } from '@domain/purchases/dto/request/create-purchase-supplier-invoice.dto';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import type { SupplierInvoiceDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice.dto';
import type { InvoiceableGoodsReceiptRow } from '@domain/supplier-invoices/repositories/invoiceable-goods-receipts.repository';
import { SupplierInvoiceHoldsDomainService } from '@domain/supplier-invoices/services/supplier-invoice-holds.service';
import { SupplierInvoiceLinesDomainService } from '@domain/supplier-invoices/services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
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
    private readonly purchasesService: PurchasesDomainService,
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
    const invoiceable = await this.invoicesService.findInvoiceableGoodsReceiptRows({
      supplierId: dto.supplierId,
      siteId,
    });
    const invoicedLegs: InvoicedLeg[] = [];
    for (const leg of legs) {
      const purchase = await this.purchasesService.findDetailOrThrow(leg.purchaseId);
      const { documents } = await this.progressService.findLegFulfilment(purchase, leg);
      const orderIds = new Set(
        documents.purchaseOrders
          .filter((po) => po.status !== PurchaseOrderStatusValues.CANCELLED && po.currencyCode === dto.currencyCode)
          .map((po) => po.id),
      );
      const receipts = invoiceable.filter((row) => orderIds.has(row.purchaseOrderId) && this.invoicedQtyOf(row).gt(0));
      if (receipts.length > 0) invoicedLegs.push({ purchase, leg, receipts });
    }
    if (invoicedLegs.length > 0) return invoicedLegs;
    throw new BadRequestException({
      label: 'Nothing to Invoice',
      detail: `Nothing received from this supplier on its open purchases at this site is left to invoice in ${dto.currencyCode}.`,
    });
  }

  // Adds one item line per receipt lot (or item without lots) for what is still open of it, in the caller's transaction
  private async addLines(invoice: SupplierInvoiceDto, receipts: InvoiceableGoodsReceiptRow[]): Promise<void> {
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
      await this.invoiceLinesService.create(invoice, line);
    }
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
