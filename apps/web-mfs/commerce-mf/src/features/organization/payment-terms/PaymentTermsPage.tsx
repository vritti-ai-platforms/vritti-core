import { useQueryClient } from '@tanstack/react-query';
import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { CalendarClock, Eye, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PAYMENT_TERMS_TABLE_KEY,
  useDeletePaymentTerm,
  usePaymentTermsTable,
} from '@/hooks/organization/payment-terms';
import { PAYMENT_TERM_BASELINE_LABELS, type PaymentTermData } from '@/schemas/payment-terms';
import { AddPaymentTermDialog } from './forms/AddPaymentTermDialog';
import { PaymentTermStatusBadge } from './PaymentTermStatusBadge';

function paymentTermPath(term: Pick<PaymentTermData, 'id' | 'name'>, tab: 'overview' | 'rules'): string {
  return `${buildSlug(term.name, term.id)}/${tab}`;
}

export const PaymentTermsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = usePaymentTermsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeletePaymentTerm();

  const handleDelete = useCallback(
    async (row: PaymentTermData) => {
      const ok = await confirm({
        title: `Delete "${row.name}"?`,
        description: 'This permanently removes the payment term. Terms used by a supplier or site cannot be deleted.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PaymentTermData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      { accessorKey: 'summary', header: 'Terms', cell: ({ row }) => row.original.summary ?? '—', enableSorting: false },
      {
        accessorKey: 'baseline',
        header: 'Counted From',
        cell: ({ row }) => PAYMENT_TERM_BASELINE_LABELS[row.original.baseline],
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <PaymentTermStatusBadge status={row.original.status} />,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            {
              id: 'view',
              icon: Eye,
              label: 'View',
              onClick: () => navigate(paymentTermPath(r, 'overview')),
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_PAYMENT_TERMS.delete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-org-payment-terms',
    label: 'payment term',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Terms"
        description="Define when supplier invoices fall due and the early-payment discounts they offer."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_PAYMENT_TERMS.view}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_PAYMENT_TERMS.add}
            >
              Add Payment Term
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: CalendarClock,
          title: 'No payment terms',
          description: 'Add a payment term so suppliers and site enrollments can say when invoices fall due.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_PAYMENT_TERMS.add}
            >
              Add Payment Term
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Payment Term"
        description="Start a draft payment term. You add its rules next and activate it once they total 100%."
        content={(close) => (
          <AddPaymentTermDialog
            onSuccess={(term) => {
              close();
              navigate(paymentTermPath(term, 'rules'));
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
