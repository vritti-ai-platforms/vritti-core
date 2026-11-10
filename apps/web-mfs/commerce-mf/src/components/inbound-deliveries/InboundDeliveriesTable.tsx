import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type InboundDeliveryData,
  inboundDeliverySourceConfig,
  inboundDeliveryStatusConfig,
} from '@/schemas/inbound-deliveries';
import { SiteFilter } from '@/selectors/site';
import type { InboundDeliveriesBinding } from './bindings';
import { CreateInboundDeliveryDialog } from './forms/CreateInboundDeliveryDialog';
import { InboundDeliveryStatusBadge } from './InboundDeliveryStatusBadge';

interface InboundDeliveriesTableProps {
  binding: InboundDeliveriesBinding;
}

const STATUS_OPTIONS = Object.entries(inboundDeliveryStatusConfig).map(([value, { label }]) => ({ label, value }));
const SOURCE_OPTIONS = Object.entries(inboundDeliverySourceConfig).map(([value, { label }]) => ({ label, value }));

// Inbound deliveries announced by suppliers or created by goods receipts (shown by their receipt number); across the legal entity's sites each names its site, and a row opens the delivery
export const InboundDeliveriesTable: React.FC<InboundDeliveriesTableProps> = ({ binding }) => {
  const { mutations, SupplierFilter } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createDialog = useDialog();
  const inboundDeliveriesTableQuery = binding.useTable();

  const openDelivery = useCallback(
    (delivery: InboundDeliveryData) => navigate(buildSlug(delivery.deliveryNumber, delivery.id)),
    [navigate],
  );

  const columns = useMemo<ColumnDef<InboundDeliveryData>[]>(
    () => [
      {
        accessorKey: 'deliveryNumber',
        header: 'Delivery Number',
        cell: ({ row }) => <StringCell value={row.original.deliveryNumber} mono />,
        enableSorting: true,
      },
      ...(binding.spansSites
        ? [
            {
              accessorKey: 'siteName',
              header: 'Site',
              cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
              enableSorting: false,
            } satisfies ColumnDef<InboundDeliveryData>,
          ]
        : []),
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <InboundDeliveryStatusBadge status={row.original.status} />,
        enableSorting: true,
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
        enableSorting: true,
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
        enableSorting: true,
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
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: binding.viewPermission,
                onClick: () => openDelivery(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [binding.spansSites, binding.viewPermission, openDelivery],
  );

  const inboundDeliveriesTable = useDataTable({
    columns,
    slug: binding.tableSlug,
    label: 'inbound delivery',
    query: inboundDeliveriesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });

  const newDeliveryAction = mutations && (
    <Button
      size="sm"
      permission={mutations.permissions.add}
      startAdornment={<Plus className="size-4" />}
      onClick={createDialog.open}
    >
      New Delivery
    </Button>
  );

  return (
    <>
      <DataTable
        table={inboundDeliveriesTable}
        permission={binding.viewPermission}
        onRowClick={openDelivery}
        contextBar={
          binding.spansSites && (
            <SiteFilter name="sites" label="Sites" placeholder="All sites" mode="context" multiple />
          )
        }
        searchConfig={{
          columns: [
            { id: 'deliveryNumber', label: 'Delivery Number' },
            { id: 'supplierName', label: 'Supplier' },
            { id: 'trackingNumber', label: 'Tracking Number' },
            { id: 'supplierDeliveryNoteNumber', label: 'Delivery Note' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter key="status" name="status" label="Status" multiple options={STATUS_OPTIONS} />,
          <SelectFilter key="source" name="source" label="Source" multiple options={SOURCE_OPTIONS} />,
          <SupplierFilter key="supplierId" />,
        ]}
        toolbarActions={newDeliveryAction ? { actions: newDeliveryAction } : undefined}
        emptyStateConfig={{
          icon: Truck,
          title: 'No inbound deliveries',
          description: mutations
            ? 'Announce a delivery when a supplier ships goods against your purchase orders.'
            : 'No supplier has announced a delivery to any site yet.',
          action: newDeliveryAction || undefined,
        }}
      />

      {mutations && (
        <Dialog
          handle={createDialog}
          icon={Truck}
          title="New Delivery"
          description="Announce a delivery a supplier is sending to this site."
          content={(close) => (
            <CreateInboundDeliveryDialog
              mutations={mutations}
              onSuccess={(delivery) => {
                close();
                openDelivery(delivery);
              }}
              onCancel={close}
            />
          )}
        />
      )}
    </>
  );
};
