import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Trash2, Truck } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSupplier } from '@/hooks/useDeleteSupplier';
import { SUPPLIERS_TABLE_KEY, useSuppliersTable } from '@/hooks/useSuppliersTable';
import type { SupplierData } from '@/schemas/suppliers';
import { AddSupplierDialog } from './forms/AddSupplierDialog';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSuppliersTable();
  const deleteMutation = useDeleteSupplier();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This supplier and all its linked items will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

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
        accessorKey: 'contactName',
        header: 'Contact',
        cell: ({ row }) => row.original.contactName ?? '—',
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone ?? '—',
      },
      {
        accessorKey: 'paymentTerms',
        header: 'Payment Terms',
        cell: ({ row }) => row.original.paymentTerms ?? '—',
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
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original.id, row.original.name),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, handleDelete],
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
        title="Add Supplier"
        description="Create a new supplier in your directory."
        content={(close) => <AddSupplierDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
