import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyAmountDto, type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type CostCategory,
  CostCategoryKindValues,
  GoodsReceiptStatusValues,
  type NewSupplierInvoiceLine,
  type SupplierInvoice,
  type SupplierInvoiceLine,
  SupplierInvoiceLineTypeValues,
} from '@/db/schema';
import type { SupplierInvoiceLineFieldsDto } from '../dto/request/supplier-invoice-line-fields.dto';
import { InvoiceableGoodsReceiptsRepository } from '../repositories/invoiceable-goods-receipts.repository';
import {
  type SupplierInvoiceLineRow,
  SupplierInvoiceLinesDomainRepository,
} from '../repositories/supplier-invoice-lines.repository';
import { SupplierInvoicesDomainRepository } from '../repositories/supplier-invoices.repository';

export type InvoiceForLines = Pick<
  SupplierInvoice,
  'id' | 'invoiceNumber' | 'status' | 'supplierId' | 'siteId' | 'currencyCode'
>;

export interface PrepareLineOptions {
  excludeLineId?: string;
  allowDraftReceipt?: boolean;
}

export interface PreparedSupplierInvoiceLine {
  label: string;
  values: Omit<NewSupplierInvoiceLine, 'supplierInvoiceId'>;
}

@Injectable()
export class SupplierInvoiceLinesDomainService {
  private readonly logger = new Logger(SupplierInvoiceLinesDomainService.name);

  constructor(
    private readonly repository: SupplierInvoiceLinesDomainRepository,
    private readonly invoicesRepository: SupplierInvoicesDomainRepository,
    private readonly invoiceableRepository: InvoiceableGoodsReceiptsRepository,
  ) {}

  // Validates a line and works out what it stores. An item line invoices a posted receipt lot (or receipt item without
  // lots) of its PO line, on an order of the invoice's supplier, site and currency, within what live invoices have not
  // invoiced of it yet; a Receive with Invoice line may invoice the draft receipt its invoice created. A charge line books an amount
  // under a charge cost category
  async prepare(
    invoice: InvoiceForLines,
    fields: SupplierInvoiceLineFieldsDto,
    options: PrepareLineOptions = {},
  ): Promise<PreparedSupplierInvoiceLine> {
    const { excludeLineId, allowDraftReceipt = false } = options;
    this.assertAmountsInCurrency(
      { unitPrice: fields.unitPrice, discountAmount: fields.discountAmount, taxAmount: fields.taxAmount },
      invoice.currencyCode,
    );
    const currencyCode = invoice.currencyCode as CurrencyCode;
    const unitPrice = majorToMinor(fields.unitPrice.value, currencyCode, 'unitPrice');
    const discountAmount = fields.discountAmount
      ? majorToMinor(fields.discountAmount.value, currencyCode, 'discountAmount')
      : 0n;
    const taxAmount = fields.taxAmount ? majorToMinor(fields.taxAmount.value, currencyCode, 'taxAmount') : 0n;

    if (fields.lineType === SupplierInvoiceLineTypeValues.CHARGE) {
      const category = await this.findChargeCategoryOrThrow(fields.costCategoryId as string);
      this.assertDiscountWithinGross(unitPrice, discountAmount);
      return {
        label: fields.description ?? category.name,
        values: {
          lineType: SupplierInvoiceLineTypeValues.CHARGE,
          purchaseOrderItemId: null,
          goodsReceiptItemId: null,
          goodsReceiptLotId: null,
          inventoryItemId: null,
          uomId: null,
          invoicedQty: null,
          freeQty: null,
          invoicedPrimaryQty: null,
          freePrimaryQty: null,
          costCategoryId: category.id,
          description: fields.description ?? null,
          unitPrice,
          discountAmount,
          taxAmount,
          lineTotal: unitPrice - discountAmount + taxAmount,
        },
      };
    }

    const goodsReceiptLotId = fields.goodsReceiptLotId ?? null;
    const receipt = await this.invoiceableRepository.findForLine(
      fields.goodsReceiptItemId as string,
      goodsReceiptLotId,
      excludeLineId,
    );
    if (!receipt) throw new NotFoundException('Goods receipt item not found.');
    if (receipt.purchaseOrderItemId !== fields.purchaseOrderItemId) {
      throw new BadRequestException({
        label: 'Receipt Not On Order Line',
        detail: `This receipt item of ${receipt.grNumber} counts another purchase order line.`,
        errors: [{ field: 'goodsReceiptItemId', message: 'Not on this order line' }],
      });
    }
    if (receipt.poSupplierId !== invoice.supplierId || receipt.poSiteId !== invoice.siteId) {
      throw new BadRequestException({
        label: 'Different Supplier or Site',
        detail: `${receipt.poNumber} is not an order of this invoice's supplier at its site.`,
        errors: [{ field: 'purchaseOrderItemId', message: 'Another supplier or site' }],
      });
    }
    if (receipt.poCurrencyCode !== invoice.currencyCode) {
      throw new BadRequestException({
        label: 'Different Currency',
        detail: `${receipt.poNumber} is in ${receipt.poCurrencyCode}; this invoice covers only ${invoice.currencyCode} orders.`,
        errors: [{ field: 'purchaseOrderItemId', message: `Order in ${receipt.poCurrencyCode}` }],
      });
    }
    if (receipt.goodsReceiptStatus !== GoodsReceiptStatusValues.POSTED && !allowDraftReceipt) {
      throw new BadRequestException({
        label: 'Receipt Not Posted',
        detail: `Goods receipt ${receipt.grNumber} is a draft. Only posted receipts are invoiced.`,
        errors: [{ field: 'goodsReceiptItemId', message: 'Receipt not posted' }],
      });
    }
    if (receipt.lotCount > 0 && goodsReceiptLotId === null) {
      throw new BadRequestException({
        label: 'Lot Required',
        detail: `"${receipt.inventoryItemName}" was received in lots on ${receipt.grNumber}; pick the lot this line invoices.`,
        errors: [{ field: 'goodsReceiptLotId', message: 'Pick a lot' }],
      });
    }
    if (goodsReceiptLotId !== null && receipt.goodsReceiptLotId === null) {
      throw new BadRequestException({
        label: 'Lot Not On Receipt',
        detail: `The lot is not one of "${receipt.inventoryItemName}" on ${receipt.grNumber}.`,
        errors: [{ field: 'goodsReceiptLotId', message: 'Not on this receipt item' }],
      });
    }

    const invoicedQty = fields.invoicedQty as number;
    const freeQty = fields.freeQty as number;
    const primaryPerUnit = new Decimal(receipt.poPrimaryUomQty).div(receipt.poUomQty);
    const invoicedPrimaryQty = primaryPerUnit.times(invoicedQty).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
    const freePrimaryQty = primaryPerUnit.times(freeQty).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
    const openPrimaryQty = new Decimal(receipt.acceptedPrimaryQty).minus(receipt.invoicedPrimaryQty);
    if (invoicedPrimaryQty.plus(freePrimaryQty).gt(openPrimaryQty)) {
      const what = receipt.lotNumber ? `lot ${receipt.lotNumber}` : `"${receipt.inventoryItemName}"`;
      throw new BadRequestException({
        label: 'More Than Received',
        detail: `Only ${Decimal.max(0, openPrimaryQty).toString()} primary units of ${what} on ${receipt.grNumber} are left to invoice; invoiced and free together go beyond that.`,
        errors: [{ field: 'invoicedQty', message: 'More than left to invoice' }],
      });
    }

    const grossAmount = BigInt(
      new Decimal(unitPrice.toString()).times(invoicedQty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
    this.assertDiscountWithinGross(grossAmount, discountAmount);
    return {
      label: receipt.inventoryItemName ?? 'Item',
      values: {
        lineType: SupplierInvoiceLineTypeValues.ITEM,
        purchaseOrderItemId: receipt.purchaseOrderItemId,
        goodsReceiptItemId: receipt.goodsReceiptItemId,
        goodsReceiptLotId,
        inventoryItemId: receipt.inventoryItemId,
        uomId: receipt.uomId,
        invoicedQty,
        freeQty,
        invoicedPrimaryQty: invoicedPrimaryQty.toNumber(),
        freePrimaryQty: freePrimaryQty.toNumber(),
        costCategoryId: null,
        description: fields.description ?? null,
        unitPrice,
        discountAmount,
        taxAmount,
        lineTotal: grossAmount - discountAmount + taxAmount,
      },
    };
  }

  // Returns an invoice's lines with the item, units, order, receipt lot and cost category they name, in entry order
  findByInvoice(supplierInvoiceId: string): Promise<SupplierInvoiceLineRow[]> {
    return this.repository.findByInvoice(supplierInvoiceId);
  }

  // Loads a line only when it is on the invoice, throwing otherwise
  async findOnInvoiceOrThrow(supplierInvoiceId: string, id: string): Promise<SupplierInvoiceLine> {
    const line = await this.repository.findOnInvoice(supplierInvoiceId, id);
    if (!line) throw new NotFoundException('Invoice line not found.');
    return line;
  }

  // Adds a prepared line and recomputes the invoice totals, in the caller's transaction
  async create(invoice: InvoiceForLines, line: PreparedSupplierInvoiceLine): Promise<SuccessResponseDto> {
    await this.repository.create({ ...line.values, supplierInvoiceId: invoice.id });
    await this.invoicesRepository.syncTotals(invoice.id);
    this.logger.log(`Added ${line.label} to supplier invoice ${invoice.invoiceNumber}`);
    return { success: true, message: `"${line.label}" added to invoice "${invoice.invoiceNumber}".` };
  }

  // Replaces a line with a prepared one and recomputes the invoice totals, in the caller's transaction
  async update(invoice: InvoiceForLines, id: string, line: PreparedSupplierInvoiceLine): Promise<SuccessResponseDto> {
    await this.repository.update(id, line.values);
    await this.invoicesRepository.syncTotals(invoice.id);
    this.logger.log(`Updated ${line.label} on supplier invoice ${invoice.invoiceNumber}`);
    return { success: true, message: `"${line.label}" updated on invoice "${invoice.invoiceNumber}".` };
  }

  // Removes a line with its holds and recomputes the invoice totals, in the caller's transaction
  async delete(invoice: InvoiceForLines, id: string): Promise<SuccessResponseDto> {
    await this.repository.delete(id);
    await this.invoicesRepository.syncTotals(invoice.id);
    this.logger.log(`Removed line ${id} from supplier invoice ${invoice.invoiceNumber}`);
    return { success: true, message: `Line removed from invoice "${invoice.invoiceNumber}".` };
  }

  // Loads the active cost category a charge line books its cost under; the item category is not a charge
  private async findChargeCategoryOrThrow(costCategoryId: string): Promise<CostCategory> {
    const category = await this.repository.findCostCategory(costCategoryId);
    if (!category) throw new NotFoundException('Cost category not found.');
    if (category.isActive && category.kind !== CostCategoryKindValues.ITEM) return category;
    const detail = category.isActive
      ? `"${category.name}" is the cost of the items themselves; pick a freight, duty, insurance, service or other category.`
      : `"${category.name}" is inactive. Activate it or pick another category.`;
    throw new BadRequestException({
      label: 'Not a Charge Category',
      detail,
      errors: [{ field: 'costCategoryId', message: category.isActive ? 'Item cost category' : 'Inactive' }],
    });
  }

  // Every amount on a line is in the invoice's currency
  private assertAmountsInCurrency(
    amounts: Record<string, CurrencyAmountDto | null | undefined>,
    currencyCode: string,
  ): void {
    const foreignField = Object.keys(amounts).find((field) => {
      const amount = amounts[field];
      return amount != null && amount.currency !== currencyCode;
    });
    if (!foreignField) return;
    throw new BadRequestException({
      label: 'Wrong currency',
      detail: `The invoice is in ${currencyCode}; enter every amount on its lines in ${currencyCode}.`,
      errors: [{ field: foreignField, message: `Must be in ${currencyCode}` }],
    });
  }

  // A discount takes off at most what the line invoices before tax
  private assertDiscountWithinGross(grossAmount: bigint, discountAmount: bigint): void {
    if (discountAmount <= grossAmount) return;
    throw new BadRequestException({
      label: 'Discount too large',
      detail: 'The discount is more than what the line invoices before it.',
      errors: [{ field: 'discountAmount', message: 'More than the invoiced amount' }],
    });
  }
}
