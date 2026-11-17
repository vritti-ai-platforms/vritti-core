import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ExternalLink, FileStack } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SupplierInvoiceStatusBadge } from '@/components/supplier-invoices/SupplierInvoiceStatusBadge';
import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import { goodsReceiptStatusConfig } from '@/schemas/goods-receipts';
import { inboundDeliveryStatusConfig } from '@/schemas/inbound-deliveries';
import { purchaseOrderStatusConfig } from '@/schemas/purchase-orders';
import type { PurchaseDetail, PurchaseSupplierDocuments } from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../../bindings';
import { goodsReceiptPath, inboundDeliveryPath, purchaseInvoicePath, purchaseOrderPath } from '../../documentPaths';

interface PurchaseDocumentsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

interface DocumentRow {
  id: string;
  number: string;
  type: string;
  supplierName: string;
  status: React.ReactNode;
  path: string;
}

// Every document the purchase's suppliers created, one row each: orders, deliveries, receipts, then invoices
function documentRows(
  groups: PurchaseSupplierDocuments[],
  workspace: string,
  invoicePath: SupplierInvoicePath,
): DocumentRow[] {
  return groups.flatMap(({ supplierId, supplierName, documents }) => [
    ...documents.purchaseOrders.map((order) => ({
      id: order.id,
      number: order.poNumber,
      type: 'Purchase Order',
      supplierName,
      status: (
        <Badge variant={purchaseOrderStatusConfig[order.status].variant}>
          {purchaseOrderStatusConfig[order.status].label}
        </Badge>
      ),
      path: purchaseOrderPath(workspace, order),
    })),
    ...documents.deliveries.map((delivery) => ({
      id: delivery.id,
      number: delivery.deliveryNumber,
      type: 'Inbound Delivery',
      supplierName,
      status: (
        <Badge variant={inboundDeliveryStatusConfig[delivery.status].variant}>
          {inboundDeliveryStatusConfig[delivery.status].label}
        </Badge>
      ),
      path: inboundDeliveryPath(workspace, delivery),
    })),
    ...documents.receipts.map((receipt) => ({
      id: receipt.id,
      number: receipt.grNumber,
      type: 'Goods Receipt',
      supplierName,
      status: (
        <Badge variant={goodsReceiptStatusConfig[receipt.status].variant}>
          {goodsReceiptStatusConfig[receipt.status].label}
        </Badge>
      ),
      path: goodsReceiptPath(workspace, receipt),
    })),
    ...documents.invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      type: invoice.isReceiveWithInvoice ? 'Receive with Invoice' : 'Supplier Invoice',
      supplierName,
      status: (
        <span className="flex items-center gap-1.5">
          <SupplierInvoiceStatusBadge status={invoice.status} />
          {invoice.openHoldCount > 0 && (
            <Badge variant="warning">{pluralize('hold', invoice.openHoldCount, true)}</Badge>
          )}
        </span>
      ),
      path: purchaseInvoicePath(workspace, invoicePath, invoice, { supplierId, supplierName }),
    })),
  ]);
}

// The documents of every supplier of the purchase in one list, each opening in its own feature
export const PurchaseDocumentsTab: React.FC<PurchaseDocumentsTabProps> = ({ binding, purchase }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const documentsQuery = binding.usePurchaseDocuments(purchase.id);
  const workspace = workspaceBase(pathname);
  const rows = useMemo(
    () => documentRows(documentsQuery.data ?? [], workspace, binding.invoicePath),
    [documentsQuery.data, workspace, binding.invoicePath],
  );

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Document',
        cell: ({ row }) => <StringCell value={row.original.number} mono />,
      },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'supplierName', header: 'Supplier', meta: { grow: true } },
      { id: 'status', header: 'Status', cell: ({ row }) => row.original.status },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[{ id: 'open', icon: ExternalLink, label: 'Open', onClick: () => navigate(row.original.path) }]}
          />
        ),
      },
    ],
    [navigate],
  );

  const documentsTable = useDataTable({
    columns,
    query: { data: { result: rows, count: rows.length }, isLoading: documentsQuery.isLoading },
    slug: 'commerce-purchase-documents',
    label: 'document',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={documentsTable}
      mode="tab"
      permission={binding.permissions.view}
      emptyStateConfig={{
        icon: FileStack,
        title: 'No documents yet',
        description: 'Purchase orders, deliveries, receipts and invoices appear here as the suppliers move on.',
      }}
    />
  );
};
