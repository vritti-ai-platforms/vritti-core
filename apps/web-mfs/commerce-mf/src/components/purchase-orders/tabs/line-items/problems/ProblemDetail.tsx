import { Button } from '@vritti/quantum-ui/Button';
import { StringCell } from '@vritti/quantum-ui/DataTable';
import { ArrowUpRight } from 'lucide-react';
import type React from 'react';
import { GoodsReceiptStatusBadge } from '@/components/goods-receipts/GoodsReceiptStatusBadge';
import { SupplierInvoiceStatusBadge } from '@/components/supplier-invoices/SupplierInvoiceStatusBadge';
import { goodsReceiptItemFlagLabels } from '@/schemas/goods-receipts';
import type { PurchaseOrderProblem } from '@/schemas/purchase-orders';
import { SUPPLIER_INVOICE_FLAG_LABELS } from '@/schemas/supplier-invoices';

interface ProblemDetailProps {
  problem: PurchaseOrderProblem;
  onOpen?: (problem: PurchaseOrderProblem) => void;
}

// One flag as its document reports it — what was found, on which receipt or invoice, for which batch; with `onOpen`
// the document number opens it, otherwise the row around it does
export const ProblemDetail: React.FC<ProblemDetailProps> = ({ problem, onOpen }) => (
  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-foreground">
        {problem.source === 'GOODS_RECEIPT'
          ? goodsReceiptItemFlagLabels[problem.code]
          : SUPPLIER_INVOICE_FLAG_LABELS[problem.code]}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {onOpen ? (
          <Button variant="link" size="xs" className="h-auto p-0" onClick={() => onOpen(problem)}>
            <StringCell value={problem.documentNumber} mono />
          </Button>
        ) : (
          <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
            <StringCell value={problem.documentNumber} mono />
            <ArrowUpRight className="size-3" />
          </span>
        )}
        {problem.source === 'GOODS_RECEIPT' ? (
          <GoodsReceiptStatusBadge status={problem.documentStatus} />
        ) : (
          <SupplierInvoiceStatusBadge status={problem.documentStatus} />
        )}
      </span>
    </div>
    <span className="text-muted-foreground text-xs">{problem.detail}</span>
    {problem.lotNumber && (
      <span className="text-muted-foreground text-xs">
        Batch <StringCell value={problem.lotNumber} mono />
      </span>
    )}
  </div>
);
