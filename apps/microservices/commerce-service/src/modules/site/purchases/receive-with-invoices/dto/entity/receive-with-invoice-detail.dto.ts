import type { GoodsReceiptLineRow } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import type { AllocationWithLegRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import type { SupplierInvoiceHoldDto } from '@domain/supplier-invoices/dto/entity/supplier-invoice-hold.dto';
import type { SupplierInvoiceLineRow } from '@domain/supplier-invoices/repositories/supplier-invoice-lines.repository';
import type {
  SupplierInvoicePurchaseRef,
  SupplierInvoiceRow,
} from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { formatISO, parseISO } from 'date-fns';
import { ReceiveWithInvoiceOpenLineDto } from './receive-with-invoice-open-line.dto';

export type ReceiveWithInvoiceStatus = 'DRAFT' | 'POSTED';

export class ReceiveWithInvoiceDetailLineDto {
  allocationId: string;
  quantity: number;
  freeQty: number;
  unitPrice: CurrencyAmountDto;
  discountAmount: CurrencyAmountDto;
  taxAmount: CurrencyAmountDto;
  lotNumber: string | null;
  expiryDate: string | null;
  manufacturingDate: string | null;
  mrp: CurrencyAmountDto;
  locationId: string | null;
  inventoryItemName: string;
  uomSymbol: string | null;
  isLotTracked: boolean;
  purchaseId: string;
  purchaseNumber: string;

  // Shapes a Receive with Invoice line from its supplier invoice line, the allocation it receives and the receipt line it put away (with its
  // batch); unset amounts are zero and the MRP is in the legal entity's currency
  static from(
    line: SupplierInvoiceLineRow,
    allocation: AllocationWithLegRow,
    receiptLine: GoodsReceiptLineRow | undefined,
    currencyCode: string,
    leCurrencyCode: string,
  ): ReceiveWithInvoiceDetailLineDto {
    const dto = new ReceiveWithInvoiceDetailLineDto();
    dto.allocationId = allocation.id;
    dto.quantity = line.invoicedQty ?? 0;
    dto.freeQty = line.freeQty ?? 0;
    dto.unitPrice = CurrencyAmountDto.from(line.unitPrice, currencyCode);
    dto.discountAmount = CurrencyAmountDto.from(line.discountAmount, currencyCode);
    dto.taxAmount = CurrencyAmountDto.from(line.taxAmount, currencyCode);
    dto.lotNumber = receiptLine?.lotNumber ?? null;
    dto.expiryDate = ReceiveWithInvoiceDetailLineDto.dateOf(receiptLine?.lotExpiryDate ?? null);
    dto.manufacturingDate = ReceiveWithInvoiceDetailLineDto.dateOf(receiptLine?.lotManufacturingDate ?? null);
    dto.mrp = CurrencyAmountDto.from(receiptLine?.lotMrp ?? 0n, leCurrencyCode);
    dto.locationId = receiptLine?.locationId ?? null;
    dto.inventoryItemName = allocation.inventoryItemName;
    dto.uomSymbol = allocation.uomSymbol;
    dto.isLotTracked = ReceiveWithInvoiceOpenLineDto.isLotTracked(allocation);
    dto.purchaseId = allocation.purchaseId;
    dto.purchaseNumber = allocation.purchaseNumber;
    return dto;
  }

  // Returns the calendar date of a stored lot date
  private static dateOf(value: string | null): string | null {
    return value === null ? null : formatISO(parseISO(value), { representation: 'date' });
  }
}

export interface ReceiveWithInvoiceDetails {
  status: ReceiveWithInvoiceStatus;
  leCurrencyCode: string;
  receipts: GoodsReceiptRow[];
  lines: ReceiveWithInvoiceDetailLineDto[];
  holds: SupplierInvoiceHoldDto[];
}

export class ReceiveWithInvoiceDetailDto {
  supplierInvoiceId: string;
  siteId: string;
  status: ReceiveWithInvoiceStatus;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string | null;
  currencyCode: string;
  exchangeRate: number | null;
  receivedDate: string;
  defaultLocationId: string | null;
  supplierDeliveryNoteNumber: string | null;
  notes: string | null;
  lines: ReceiveWithInvoiceDetailLineDto[];
  purchases: SupplierInvoicePurchaseRef[];
  goodsReceipts: { id: string; grNumber: string }[];
  holds: SupplierInvoiceHoldDto[];

  // Shapes a Receive with Invoice from its invoice and receipts: the received date and delivery note are the first receipt's,
  // the default location the first line's; a tax date equal to the invoice date and the rate of an invoice in the legal
  // entity's currency read as unset
  static from(invoice: SupplierInvoiceRow, details: ReceiveWithInvoiceDetails): ReceiveWithInvoiceDetailDto {
    const [firstReceipt] = details.receipts;
    const dto = new ReceiveWithInvoiceDetailDto();
    dto.supplierInvoiceId = invoice.id;
    dto.siteId = invoice.siteId;
    dto.status = details.status;
    dto.supplierId = invoice.supplierId;
    dto.supplierName = invoice.supplierName ?? '';
    dto.invoiceNumber = invoice.invoiceNumber;
    dto.invoiceDate = invoice.invoiceDate;
    dto.taxDate = invoice.taxDate === invoice.invoiceDate ? null : invoice.taxDate;
    dto.currencyCode = invoice.currencyCode;
    dto.exchangeRate = invoice.currencyCode === details.leCurrencyCode ? null : invoice.exchangeRate;
    dto.receivedDate = firstReceipt?.receivedDate ?? invoice.invoiceDate;
    dto.defaultLocationId = details.lines[0]?.locationId ?? null;
    dto.supplierDeliveryNoteNumber = firstReceipt?.supplierDeliveryNoteNumber ?? null;
    dto.notes = invoice.notes;
    dto.lines = details.lines;
    dto.purchases = invoice.purchases;
    dto.goodsReceipts = details.receipts.map((receipt) => ({ id: receipt.id, grNumber: receipt.grNumber }));
    dto.holds = details.holds;
    return dto;
  }
}
