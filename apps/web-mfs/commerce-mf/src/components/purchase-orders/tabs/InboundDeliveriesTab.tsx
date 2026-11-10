import { useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { InboundDeliveryStatusBadge } from '@/components/inbound-deliveries/InboundDeliveryStatusBadge';
import { type InboundDeliveryData, inboundDeliverySourceConfig } from '@/schemas/inbound-deliveries';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { workspaceBase } from '@/utils/workspace';
import type { PurchaseOrdersBinding } from '../bindings';

interface InboundDeliveriesTabProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
}

// The inbound deliveries carrying any of the order's lines, announced or created by a receipt; a row opens the delivery
// in the inbound deliveries feature
export const InboundDeliveriesTab: React.FC<InboundDeliveriesTabProps> = ({ binding, purchaseOrder }) => {
  const purchaseOrderId = purchaseOrder.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const inboundDeliveriesTableQuery = binding.useInboundDeliveriesTable(purchaseOrderId);

  const openDelivery = useCallback(
    (delivery: InboundDeliveryData) =>
      navigate(`${workspaceBase(pathname)}/inbound-deliveries/${buildSlug(delivery.deliveryNumber, delivery.id)}`),
    [navigate, pathname],
  );

  const columns = useMemo<ColumnDef<InboundDeliveryData>[]>(
    () => [
      {
        accessorKey: 'deliveryNumber',
        header: 'Delivery Number',
        cell: ({ row }) => <StringCell value={row.original.deliveryNumber} mono />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <InboundDeliveryStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) =>
          row.original.source === 'RECEIPT' ? (
            <StringCell value={row.original.sourceGrNumber} mono />
          ) : (
            inboundDeliverySourceConfig[row.original.source].label
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        cell: ({ row }) => <DateCell value={row.original.expectedDeliveryDate} />,
      },
      {
        accessorKey: 'carrier',
        header: 'Carrier',
        cell: ({ row }) => <StringCell value={row.original.carrier} />,
        enableSorting: false,
      },
      {
        accessorKey: 'trackingNumber',
        header: 'Tracking Number',
        cell: ({ row }) => <StringCell value={row.original.trackingNumber} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'supplierDeliveryNoteNumber',
        header: 'Delivery Note',
        cell: ({ row }) => <StringCell value={row.original.supplierDeliveryNoteNumber} mono />,
      },
      {
        accessorKey: 'poNumbers',
        header: 'Purchase Orders',
        cell: ({ row }) => <StringCell value={row.original.poNumbers.join(', ')} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'lineCount',
        header: 'Lines',
        cell: ({ row }) => <NumberCell value={row.original.lineCount} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => openDelivery(row.original) }]} />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openDelivery],
  );

  const inboundDeliveriesTable = useDataTable({
    columns,
    slug: binding.inboundDeliveriesTableSlug(purchaseOrderId),
    label: 'inbound delivery',
    query: inboundDeliveriesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.inboundDeliveriesTableKey(purchaseOrderId) }),
  });

  return (
    <DataTable
      table={inboundDeliveriesTable}
      mode="tab"
      permission={binding.permissions.view}
      onRowClick={openDelivery}
      emptyStateConfig={{
        icon: Truck,
        title: 'No inbound deliveries',
        description:
          "Deliveries the supplier announces for this order's lines, or that its goods receipts create, will appear here.",
      }}
    />
  );
};
