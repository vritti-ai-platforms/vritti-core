import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { InventoryItemFilter } from '@vritti/quantum-ui/selects/inventory-item';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierData } from '@/schemas/suppliers';
import { SUPPLIERS_TABLE_KEY, useSuppliersTable } from '@/hooks/legal-entity/suppliers';
import { AddSupplierDialog } from './forms/AddSupplierDialog';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSuppliersTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<SupplierData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currency',
        enableSorting: true,
      },
      {
        accessorKey: 'contactName',
        header: 'Contact',
        cell: ({ row }) => <StringCell value={row.original.contactName} />,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <StringCell value={row.original.phone} />,
      },
      {
        accessorKey: 'paymentTerms',
        header: 'Payment Terms',
        cell: ({ row }) => <StringCell value={row.original.paymentTerms} />,
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
    slug: 'commerce-suppliers',
    label: 'supplier',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers" description="Manage your supplier directory and linked inventory items" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        filters={[<InventoryItemFilter key="inventoryItemId" />]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Supplier
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Truck,
          title: 'No suppliers',
          description: 'Add your first supplier to start managing procurement.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Supplier
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Truck}
        title="Add Supplier"
        description="Create a new supplier in your directory."
        className="max-w-3xl"
        content={(close) => <AddSupplierDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
