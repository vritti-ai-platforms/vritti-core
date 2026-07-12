import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, NumberCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, FileText, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvoiceData, InvoiceStatus, InvoiceType } from '@/schemas/invoices';
import { INVOICES_TABLE_KEY, useInvoicesTable } from '@/site/hooks/invoices';
import { CreateInvoiceDialog } from './forms/CreateInvoiceDialog';

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  ISSUED: { label: 'Issued', variant: 'secondary' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  PAID: { label: 'Paid', variant: 'secondary', className: 'bg-success/15 text-success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  VOID: { label: 'Void', variant: 'outline' },
};

const typeConfig: Record<InvoiceType, { label: string; className: string }> = {
  PAYABLE: { label: 'Payable', className: 'bg-warning/15 text-warning' },
  RECEIVABLE: { label: 'Receivable', className: 'bg-success/15 text-success' },
};

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInvoicesTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<InvoiceData>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice Number',
        enableSorting: true,
      },
      {
        accessorKey: 'partyName',
        header: 'Party',
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = typeConfig[row.original.type];
          return (
            <Badge variant="secondary" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = statusConfig[row.original.status];
          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <NumberCell value={row.original.totalAmount} />,
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => <NumberCell value={row.original.balance} />,
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
                onClick: () => navigate(buildSlug(row.original.invoiceNumber, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-invoices',
    label: 'invoice',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="Create and manage invoices for payables and receivables" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'invoiceNumber', label: 'Invoice Number' },
            { id: 'partyName', label: 'Party' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Invoice
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No invoices',
          description: 'Create your first invoice to start tracking payables and receivables.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Invoice
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={FileText}
        title="New Invoice"
        description="Create an invoice for a supplier or customer."
        content={(close) => <CreateInvoiceDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
