import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { ExternalLink, FileStack } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PurchaseOrderStatusBadge } from '@/components/purchase-orders/PurchaseOrderStatusBadge';
import { SupplierInvoiceStatusBadge } from '@/components/supplier-invoices/SupplierInvoiceStatusBadge';
import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import { goodsReceiptStatusConfig } from '@/schemas/goods-receipts';
import { inboundDeliveryStatusConfig } from '@/schemas/inbound-deliveries';
import {
  type PurchaseDetail,
  type PurchaseItemDocument,
  PurchaseItemDocumentTypeValues,
  type PurchaseItemView,
  purchaseItemDocumentTypeConfig,
  purchaseItemDocumentTypeOptions,
} from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { goodsReceiptPath, inboundDeliveryPath, purchaseOrderPath } from '../documentPaths';

interface PurchaseItemDocumentsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
}

// A document's status badge, in its own feature's terms
const DocumentStatusBadge = ({ document }: { document: PurchaseItemDocument }) => {
  switch (document.type) {
    case PurchaseItemDocumentTypeValues.PURCHASE_ORDER:
      return <PurchaseOrderStatusBadge status={document.status} />;
    case PurchaseItemDocumentTypeValues.INBOUND_DELIVERY:
      return (
        <Badge variant={inboundDeliveryStatusConfig[document.status].variant}>
          {inboundDeliveryStatusConfig[document.status].label}
        </Badge>
      );
    case PurchaseItemDocumentTypeValues.GOODS_RECEIPT:
      return (
        <Badge variant={goodsReceiptStatusConfig[document.status].variant}>
          {goodsReceiptStatusConfig[document.status].label}
        </Badge>
      );
    case PurchaseItemDocumentTypeValues.SUPPLIER_INVOICE:
      return <SupplierInvoiceStatusBadge status={document.status} />;
  }
};

// Where a document opens, from the workspace root
function documentPath(document: PurchaseItemDocument, workspace: string, invoicePath: SupplierInvoicePath): string {
  const { documentId: id, documentNumber } = document;
  switch (document.type) {
    case PurchaseItemDocumentTypeValues.PURCHASE_ORDER:
      return purchaseOrderPath(workspace, { id, poNumber: documentNumber });
    case PurchaseItemDocumentTypeValues.INBOUND_DELIVERY:
      return inboundDeliveryPath(workspace, { id, deliveryNumber: documentNumber });
    case PurchaseItemDocumentTypeValues.GOODS_RECEIPT:
      return goodsReceiptPath(workspace, { id, grNumber: documentNumber });
    case PurchaseItemDocumentTypeValues.SUPPLIER_INVOICE:
      return `${workspace}/${invoicePath({
        id,
        invoiceNumber: documentNumber,
        supplierId: document.supplierId,
        supplierName: document.supplierName,
      })}`;
  }
}

// The document lines that move the item a page at a time — its PO lines, deliveries, receipts and invoices — narrowed
// to one kind by the context bar, each opening in its own feature
export const PurchaseItemDocumentsTab: React.FC<PurchaseItemDocumentsTabProps> = ({ binding, purchase, item }) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const documentsQuery = binding.usePurchaseItemDocumentsTable(purchase.id, item.id);
  const workspace = workspaceBase(pathname);

  const columns = useMemo<ColumnDef<PurchaseItemDocument>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: 'Document',
        enableSorting: true,
        cell: ({ row }) => <StringCell value={row.original.documentNumber} mono />,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => purchaseItemDocumentTypeConfig[row.original.type].label,
      },
      { accessorKey: 'supplierName', header: 'Supplier', meta: { grow: true } },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <DocumentStatusBadge document={row.original} />,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        enableSorting: true,
        cell: ({ row }) => <DateCell value={row.original.date} />,
      },
      {
        accessorKey: 'primaryQty',
        header: `Quantity ${item.primaryUomSymbol}`.trim(),
        cell: ({ row }) => <NumberCell value={row.original.primaryQty} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'open',
                icon: ExternalLink,
                label: `Open ${purchaseItemDocumentTypeConfig[row.original.type].label}`,
                onClick: () => navigate(documentPath(row.original, workspace, binding.invoicePath)),
              },
            ]}
          />
        ),
      },
    ],
    [item.primaryUomSymbol, navigate, workspace, binding.invoicePath],
  );

  const documentsTable = useDataTable({
    columns,
    slug: binding.purchaseItemTableSlug(purchase.id, item.id, 'documents'),
    label: 'document',
    query: documentsQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: binding.purchaseItemTableKeys.documents(purchase.id, item.id) }),
  });

  return (
    <DataTable
      table={documentsTable}
      mode="tab"
      permission={permissions.view}
      contextBar={
        <SelectFilter key="type" name="type" label="Type" options={purchaseItemDocumentTypeOptions} mode="context" />
      }
      searchConfig={{ columns: [{ id: 'documentNumber', label: 'Document Number' }], searchAll: true }}
      filters={[<binding.SupplierFilter key="supplierId" />]}
      emptyStateConfig={{
        icon: FileStack,
        title: 'No documents',
        description: 'Purchase orders, deliveries, receipts and invoices for the item show here once it is ordered.',
      }}
    />
  );
};
