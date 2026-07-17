import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerData } from '@/schemas/customers';
import { CUSTOMERS_TABLE_KEY, useCustomersTable } from '@/hooks/site/customers';
import { AddCustomerDialog } from './forms/AddCustomerDialog';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useCustomersTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<CustomerData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <StringCell value={row.original.phone} />,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <StringCell value={row.original.email} />,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
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
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
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
    slug: 'commerce-site-customers',
    label: 'customer',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" description="Manage your customer directory" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'phone', label: 'Phone' },
            { id: 'email', label: 'Email' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Customer
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Users,
          title: 'No customers',
          description: 'Add your first customer to start tracking sales.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Customer
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Users}
        title="Add Customer"
        description="Create a new customer in your directory."
        className="max-w-3xl"
        content={(close) => <AddCustomerDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
