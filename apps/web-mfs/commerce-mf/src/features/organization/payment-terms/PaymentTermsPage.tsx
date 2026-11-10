import { useQueryClient } from '@tanstack/react-query';
import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, type RowAction, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { CalendarClock, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAYMENT_TERMS_TABLE_KEY, usePaymentTermsTable } from '@/hooks/organization/payment-terms';
import {
  PAYMENT_TERM_BASELINE_LABELS,
  PAYMENT_TERM_BASELINE_OPTIONS,
  PAYMENT_TERM_STATUS_OPTIONS,
  type PaymentTermData,
} from '@/schemas/payment-terms';
import { PaymentTermStatusBadge } from './components/PaymentTermStatusBadge';
import { AddPaymentTermDialog } from './forms/AddPaymentTermDialog';

function paymentTermPath(term: Pick<PaymentTermData, 'id' | 'name'>, tab: 'overview' | 'rules'): string {
  return `${buildSlug(term.name, term.id)}/${tab}`;
}

export const PaymentTermsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const paymentTermsTableQuery = usePaymentTermsTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<PaymentTermData>[]>(
    () => [
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'baseline',
        header: 'Baseline',
        cell: ({ row }) => PAYMENT_TERM_BASELINE_LABELS[row.original.baseline],
        enableSorting: true,
      },
      {
        accessorKey: 'isPublished',
        header: 'Status',
        cell: ({ row }) => <PaymentTermStatusBadge isPublished={row.original.isPublished} />,
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
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const paymentTermsTable = useDataTable({
    columns,
    slug: 'commerce-org-payment-terms',
    label: 'payment term',
    query: paymentTermsTableQuery,
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
        table={paymentTermsTable}
        permission={ORG_PAYMENT_TERMS.view}
        filters={[
          <SelectFilter key="isPublished" name="isPublished" label="Status" options={PAYMENT_TERM_STATUS_OPTIONS} />,
          <SelectFilter key="baseline" name="baseline" label="Baseline" options={PAYMENT_TERM_BASELINE_OPTIONS} />,
        ]}
        searchConfig={{
          columns: [{ id: 'name', label: 'Name' }],
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
        description="Start a draft payment term. You add its rules next and publish it once they total 100%."
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
