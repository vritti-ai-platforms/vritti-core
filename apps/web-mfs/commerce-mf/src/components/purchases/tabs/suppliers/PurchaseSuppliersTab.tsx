import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Ban, Eye, Users } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  type PurchaseDetail,
  type PurchaseLeg,
  PurchaseLegStatusValues,
  PurchaseLegStepValues,
  purchaseLegStepConfig,
  purchaseTypeConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { purchaseLegState } from '../../purchaseState';
import { CancelSupplierDialog } from '../../suppliers/forms/CancelSupplierDialog';
import { PurchaseSupplierDetail } from './PurchaseSupplierDetail';

interface PurchaseSuppliersTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

const STEP_OPTIONS = Object.entries(purchaseLegStepConfig).map(([value, { label }]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: PurchaseLegStatusValues.OPEN, label: 'Open' },
  { value: PurchaseLegStatusValues.CLOSED, label: 'Closed' },
  { value: PurchaseLegStatusValues.CANCELLED, label: 'Cancelled' },
];

// The purchase's suppliers a page at a time, each on its own flow: where it stands, what it sources and how much is
// received; a row opens the supplier with its documents and actions
export const PurchaseSuppliersTab: React.FC<PurchaseSuppliersTabProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const fmt = useFormatters();
  const queryClient = useQueryClient();
  const suppliersQuery = binding.usePurchaseSuppliersTable(purchase.id);

  const columns = useMemo<ColumnDef<PurchaseLeg>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        enableSorting: true,
        size: 240,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.supplierName}</span>
            <Typography variant="caption" intent="muted">
              {purchaseTypeConfig[row.original.type].label}
            </Typography>
          </div>
        ),
      },
      {
        id: 'state',
        header: 'Step',
        cell: ({ row }) => {
          const leg = row.original;
          const rejected = leg.step === PurchaseLegStepValues.SOURCING && leg.rejection !== null;
          const state = purchaseLegState(leg, rejected);
          return <Badge variant={state.variant}>{state.label}</Badge>;
        },
      },
      {
        accessorKey: 'lineCount',
        header: 'Lines',
        cell: ({ row }) => pluralize('line', row.original.lineCount, true),
      },
      {
        id: 'sourcedTotal',
        header: 'Sourced',
        cell: ({ row }) => <CurrencyCell value={row.original.sourcedTotal} />,
      },
      {
        id: 'progress',
        header: 'Received · Invoiced',
        meta: { grow: true, label: 'Received · Invoiced' },
        cell: ({ row }) => {
          const { duePrimaryQty, receivedPrimaryQty, invoicedPrimaryQty } = row.original.progress;
          return (
            <span className="font-mono text-sm">
              {`${fmt.number(receivedPrimaryQty).primary} · ${fmt.number(invoicedPrimaryQty).primary} of ${fmt.number(duePrimaryQty).primary}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        enableSorting: true,
        cell: ({ row }) => <DateCell value={row.original.submittedAt} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const leg = row.original;
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  permission: permissions.view,
                  dialog: {
                    title: leg.supplierName,
                    description: purchaseTypeConfig[leg.type].description,
                    className: 'max-w-4xl',
                    content: () => <PurchaseSupplierDetail binding={binding} purchase={purchase} legId={leg.id} />,
                  },
                },
                {
                  id: 'cancel',
                  icon: Ban,
                  label: 'Cancel Supplier',
                  variant: 'destructive',
                  permission: permissions.edit,
                  disabled: leg.blockers.cancel !== null,
                  disabledTip: leg.blockers.cancel ?? undefined,
                  dialog: {
                    title: `Cancel ${leg.supplierName}?`,
                    description: 'Its purchase orders and planned deliveries are cancelled. This cannot be undone.',
                    content: (close) => (
                      <CancelSupplierDialog
                        binding={binding}
                        purchase={purchase}
                        leg={leg}
                        onSuccess={close}
                        onCancel={close}
                      />
                    ),
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [binding, purchase, permissions, fmt],
  );

  const suppliersTable = useDataTable({
    columns,
    slug: binding.purchaseTableSlug(purchase.id, 'suppliers'),
    label: 'supplier',
    query: suppliersQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.purchaseTableKeys.suppliers(purchase.id) }),
  });

  return (
    <DataTable
      table={suppliersTable}
      mode="tab"
      permission={permissions.view}
      contextBar={
        <>
          <SelectFilter key="status" name="status" label="Status" options={STATUS_OPTIONS} mode="context" />
          <SelectFilter key="step" name="step" label="Step" options={STEP_OPTIONS} mode="context" />
        </>
      }
      searchConfig={{ columns: [{ id: 'supplierName', label: 'Supplier' }], searchAll: true }}
      emptyStateConfig={{
        icon: Users,
        title: 'No suppliers',
        description: 'A supplier joins the purchase with its first allocation, from the Items tab.',
      }}
    />
  );
};
