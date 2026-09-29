import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartData } from '@/schemas/carts';
import { OpenCartDialog } from './forms/OpenCartDialog';
import type { CartsBinding } from './types';

/**
 * The baskets open in this workspace.
 *
 * Reach runs upward only: a site sees its own baskets and its company's, a company sees only the
 * ones it holds itself. The page is the same either way — which workspace is asking is the
 * binding's business, not this component's.
 */
export const CartsPage: React.FC<{ binding: CartsBinding }> = ({ binding }) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useCartsTable();
  const openDialog = useDialog();

  const columns = useMemo<ColumnDef<CartData>[]>(
    () => [
      {
        accessorKey: 'partyName',
        header: 'Shopper',
        cell: ({ row }) => <StringCell value={row.original.partyName ?? 'Walk-in'} />,
        enableSorting: true,
      },
      {
        accessorKey: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <NumberCell value={row.original.itemCount} />,
        enableSorting: false,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.checkoutStartedAt ? (
            <Badge variant="warning">Checking out</Badge>
          ) : (
            <Badge variant="secondary">Open</Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: 'Opened',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
        enableSorting: true,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last changed',
        cell: ({ row }) => <DateTimeCell value={row.original.updatedAt} />,
        enableSorting: true,
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
                onClick: () => navigate(buildSlug(row.original.partyName ?? 'walk-in', row.original.id)),
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
    slug: binding.tableSlug,
    label: 'basket',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Carts" description={binding.description} />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={permissions.view}
        searchConfig={{
          columns: [{ id: 'partyName', label: 'Shopper' }],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={openDialog.open}
            >
              Open Basket
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ShoppingCart,
          title: 'No open baskets',
          description: `Baskets appear here when a shopper adds something, or when you open one for them at this ${binding.scopeNoun}.`,
          action: (
            <Button permission={permissions.add} startAdornment={<Plus className="size-4" />} onClick={openDialog.open}>
              Open Basket
            </Button>
          ),
        }}
      />

      <Dialog
        handle={openDialog}
        icon={ShoppingCart}
        title="Open a Basket"
        description="Pick the shopper this basket is for."
        content={(close) => <OpenCartDialog binding={binding} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
