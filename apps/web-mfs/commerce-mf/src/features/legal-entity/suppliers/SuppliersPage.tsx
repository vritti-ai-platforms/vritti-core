import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { CircleCheck, CircleSlash, Eye, Plus, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SUPPLIERS_TABLE_KEY,
  useBulkSetSupplierActive,
  useSetSupplierActive,
  useSuppliersTable,
} from '@/hooks/legal-entity/suppliers';
import type { SupplierData } from '@/schemas/suppliers';
import { CurrencyFilter } from '@/selectors/currency';
import { InventoryItemFilter } from '@/selectors/inventory-item';
import { PaymentTermFilter } from '@/selectors/payment-term';
import { AddSupplierDialog } from './forms/AddSupplierDialog';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSuppliersTable();
  const addDialog = useDialog();
  const setActiveMutation = useSetSupplierActive();
  const bulkSetActiveMutation = useBulkSetSupplierActive();

  const columns = useMemo<ColumnDef<SupplierData>[]>(
    () => [
      getSelectionColumn<SupplierData>(),
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
      },
      {
        accessorKey: 'partyName',
        header: 'Company',
        enableSorting: true,
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currencies',
        cell: ({ row }) => <StringCell value={row.original.currencyCodes.join(', ')} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'defaultPaymentTermName',
        header: 'Default Payment Term',
        cell: ({ row }) => <StringCell value={row.original.defaultPaymentTermName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.isActive}
            permission={LE_SUPPLIERS.toggle}
            isLoading={setActiveMutation.isPending && setActiveMutation.variables?.id === row.original.id}
            onCheckedChange={(isActive) => setActiveMutation.mutate({ id: row.original.id, isActive })}
            ariaLabel={`Mark ${row.original.partyName} active`}
          />
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
                permission: LE_SUPPLIERS.view,
                onClick: () => navigate(`${buildSlug(row.original.partyName, row.original.id)}/overview`),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, setActiveMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-le-suppliers',
    label: 'supplier',
    serverState: response,
    enableRowSelection: true,
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
        permission={LE_SUPPLIERS.view}
        selectActions={(rows) => {
          const ids = rows.map((row) => row.original.id);
          const resetSelection = { onSuccess: () => table.resetRowSelection() };
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={LE_SUPPLIERS.toggle}
                startAdornment={<CircleCheck className="size-4" />}
                isLoading={bulkSetActiveMutation.isPending && bulkSetActiveMutation.variables?.isActive === true}
                disabled={bulkSetActiveMutation.isPending}
                onClick={() => bulkSetActiveMutation.mutate({ ids, isActive: true }, resetSelection)}
              >
                Mark Active
              </Button>
              <Button
                size="sm"
                variant="outline"
                permission={LE_SUPPLIERS.toggle}
                startAdornment={<CircleSlash className="size-4" />}
                isLoading={bulkSetActiveMutation.isPending && bulkSetActiveMutation.variables?.isActive === false}
                disabled={bulkSetActiveMutation.isPending}
                onClick={() => bulkSetActiveMutation.mutate({ ids, isActive: false }, resetSelection)}
              >
                Mark Inactive
              </Button>
            </>
          );
        }}
        searchConfig={{
          columns: [
            { id: 'partyName', label: 'Company' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        filters={[
          <ValueFilter key="code" name="code" label="Code" fieldType="string" />,
          <ValueFilter key="partyName" name="partyName" label="Company" fieldType="string" />,
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />,
          <CurrencyFilter key="currency" multiple />,
          <PaymentTermFilter key="paymentTermId" label="Default Payment Term" multiple />,
          <InventoryItemFilter key="inventoryItemId" />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" permission={LE_SUPPLIERS.add} onClick={addDialog.open}>
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
            <Button permission={LE_SUPPLIERS.add} onClick={addDialog.open}>
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
