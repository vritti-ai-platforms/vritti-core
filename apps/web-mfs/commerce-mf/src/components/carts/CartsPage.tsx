import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Eye, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartData } from '@/schemas/carts';
import { OpenCartDialog } from './forms/OpenCartDialog';
import type { CartsBinding } from './types';

/**
 * The baskets open in this workspace.
 *
 * Read reaches downward through the workspace tree, so a company lists every one of its outlets'
 * baskets while a site sees only its own. The page is the same either way — which workspace is
 * asking is the binding's business, not this component's.
 */
export const CartsPage = ({ binding }: { binding: CartsBinding }) => {
  const navigate = useNavigate();
  const { permissions } = binding;
  const { data: response } = binding.useCartsTable();
  const openDialog = useDialog();
  const closeMutation = binding.useCloseCart();

  const columns = useMemo<ColumnDef<CartData>[]>(
    () => [
      {
        accessorKey: 'partyName',
        header: 'Shopper',
        enableSorting: true,
      },
      {
        accessorKey: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <NumberCell value={row.original.itemCount} />,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.checkoutStartedAt ? (
            <Badge variant="secondary" className="bg-warning/15 text-warning">
              Checking out
            </Badge>
          ) : (
            <Badge variant="outline">Open</Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last changed',
        enableSorting: true,
        cell: ({ row }) => <DateTimeCell value={row.original.updatedAt} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              { id: 'view', icon: Eye, label: 'Open', onClick: () => navigate(row.original.id) },
              {
                id: 'close',
                icon: Trash2,
                label: 'Close basket',
                variant: 'destructive',
                permission: permissions.delete,
                onClick: () => closeMutation.mutate(row.original.id),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, closeMutation, permissions],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-site-carts',
    label: 'basket',
    serverState: response,
    enableRowSelection: false,
  });

  return (
    <>
      <PageHeader
        title="Carts"
        description={binding.description}
        actions={
          <Button startAdornment={<Plus className="size-4" />} permission={permissions.add} onClick={openDialog.open}>
            Open basket
          </Button>
        }
      />

      <DataTable table={table} permission={permissions.view} />

      <Dialog
        handle={openDialog}
        icon={ShoppingCart}
        title="Open a basket"
        description="Pick the shopper this basket is for."
        content={(close) => <OpenCartDialog binding={binding} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
