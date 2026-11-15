import type { GoodsReceiptItemFlagDto } from '@domain/goods-receipts/dto/entity/goods-receipt-item.dto';
import type { PurchaseOrderReceiptItemFlagsDto } from '@domain/goods-receipts/dto/entity/purchase-order-receipt-item-flags.dto';
import type { PurchaseOrderInvoiceHoldDto } from '@domain/supplier-invoices/dto/entity/purchase-order-invoice-hold.dto';
import _ from '@vritti/api-sdk/lodash';
import type { GoodsReceiptStatus, SupplierInvoiceStatus } from '@/db/schema';

export const PurchaseOrderProblemSourceValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const;

export type PurchaseOrderProblemSource =
  (typeof PurchaseOrderProblemSourceValues)[keyof typeof PurchaseOrderProblemSourceValues];

export class PurchaseOrderProblemDto {
  source: PurchaseOrderProblemSource;
  code: string;
  detail: string;
  blocksPayment: boolean;
  holdId: string | null;
  documentId: string;
  documentNumber: string;
  documentStatus: GoodsReceiptStatus | SupplierInvoiceStatus;
  lotNumber: string | null;

  // Shapes a flag raised on a goods receipt item
  static fromReceiptFlag(
    item: PurchaseOrderReceiptItemFlagsDto,
    flag: GoodsReceiptItemFlagDto,
  ): PurchaseOrderProblemDto {
    const dto = new PurchaseOrderProblemDto();
    dto.source = PurchaseOrderProblemSourceValues.GOODS_RECEIPT;
    dto.code = flag.code;
    dto.detail = flag.detail;
    dto.blocksPayment = false;
    dto.holdId = null;
    dto.documentId = item.goodsReceiptId;
    dto.documentNumber = item.grNumber;
    dto.documentStatus = item.receiptStatus;
    dto.lotNumber = null;
    return dto;
  }

  // Shapes an open hold on a supplier invoice line
  static fromInvoiceHold(hold: PurchaseOrderInvoiceHoldDto): PurchaseOrderProblemDto {
    const dto = new PurchaseOrderProblemDto();
    dto.source = PurchaseOrderProblemSourceValues.SUPPLIER_INVOICE;
    dto.code = hold.code;
    dto.detail = hold.detail;
    dto.blocksPayment = hold.blocksPayment;
    dto.holdId = hold.id;
    dto.documentId = hold.supplierInvoiceId;
    dto.documentNumber = hold.invoiceNumber;
    dto.documentStatus = hold.invoiceStatus;
    dto.lotNumber = hold.lotNumber;
    return dto;
  }
}

export class PurchaseOrderLineProblemsDto {
  purchaseOrderItemId: string;
  problems: PurchaseOrderProblemDto[];
}

export class PurchaseOrderProblemsSummaryDto {
  total: number;
  receiving: number;
  invoicing: number;
}

export class PurchaseOrderProblemsDto {
  summary: PurchaseOrderProblemsSummaryDto;
  lines: PurchaseOrderLineProblemsDto[];

  // Groups receipt item flags and open invoice holds by order line, receipts first
  static from(
    receiptItems: PurchaseOrderReceiptItemFlagsDto[],
    holds: PurchaseOrderInvoiceHoldDto[],
  ): PurchaseOrderProblemsDto {
    const receiptProblems = receiptItems.flatMap((item) =>
      item.flags.map((flag) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        problem: PurchaseOrderProblemDto.fromReceiptFlag(item, flag),
      })),
    );
    const invoiceProblems = holds.flatMap((hold) =>
      hold.purchaseOrderItemId
        ? [{ purchaseOrderItemId: hold.purchaseOrderItemId, problem: PurchaseOrderProblemDto.fromInvoiceHold(hold) }]
        : [],
    );
    const problemsByLine = _.groupBy([...receiptProblems, ...invoiceProblems], 'purchaseOrderItemId');

    const dto = new PurchaseOrderProblemsDto();
    dto.summary = {
      total: receiptProblems.length + invoiceProblems.length,
      receiving: receiptProblems.length,
      invoicing: invoiceProblems.length,
    };
    dto.lines = Object.entries(problemsByLine).map(([purchaseOrderItemId, lineProblems]) => ({
      purchaseOrderItemId,
      problems: lineProblems.map((lineProblem) => lineProblem.problem),
    }));
    return dto;
  }
}
