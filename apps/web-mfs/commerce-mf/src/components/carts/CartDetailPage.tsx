import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CartLineData } from '@/schemas/carts';
import { AddCartLineDialog } from './forms/AddCartLineDialog';
import type { CartsBinding } from './types';

/**
 * One basket, and what is in it.
 *
 * Lines are priced through this outlet's own channel, so what staff see here is what the shopper
 * sees — the same resolution the storefront gets, not a second opinion.
 */
export const CartDetailPage = ({ binding }: { binding: CartsBinding }) => {
  const { cartId = '' } = useParams<{ cartId: string }>();
  const navigate = useNavigate();
  const addDialog = useDialog();

  const { permissions } = binding;
  const { data: cart } = binding.useCart(cartId);
  const { data: lines } = binding.useCartItems(cartId);
  const closeMutation = binding.useCloseCart({ onSuccess: () => navigate('..') });
  const removeMutation = binding.useRemoveCartLine(cartId);

  const partyId = cart?.partyId ?? '';

  const columns = useMemo<ColumnDef<CartLineData>[]>(
    () => [
      { accessorKey: 'name', header: 'Product' },
      { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <StringCell value={row.original.sku} mono /> },
      { accessorKey: 'quantity', header: 'Qty', cell: ({ row }) => <NumberCell value={row.original.quantity} /> },
      {
        accessorKey: 'unitPrice',
        header: 'Unit price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'lineTotal',
        header: 'Total',
        cell: ({ row }) => <CurrencyCell value={row.original.lineTotal} />,
      },
      {
        accessorKey: 'isAvailable',
        header: 'Status',
        // A line this outlet has stopped selling stays in the basket and says so — dropping it
        // silently would lose what the shopper chose.
        cell: ({ row }) =>
          row.original.isAvailable ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Available
            </Badge>
          ) : (
            <Badge variant="outline">Unavailable</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: permissions.delete,
                onClick: () => removeMutation.mutate({ offeringVariantId: row.original.offeringVariantId, partyId }),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [removeMutation, partyId, permissions],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-site-cart-${cartId}-items`,
    label: 'line',
    // A plain array — a basket is a handful of lines the shopper chose the order of.
    serverState: { result: lines?.items ?? [], count: lines?.items.length ?? 0 },
    enableRowSelection: false,
  });

  return (
    <>
      <PageHeader
        title={cart?.partyName ?? ''}
        description={
          lines
            ? `${pluralize('line', lines.itemCount, true)} · ${lines.subtotal.value} ${lines.subtotal.currency}`
            : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              startAdornment={<ArrowLeft className="size-4" />}
              onClick={() => navigate('..')}
            >
              Back
            </Button>
            <Button
              startAdornment={<Plus className="size-4" />}
              permission={permissions.add}
              // Nothing to add to until the workspace's channel is known — it prices the line.
              disabled={!cart?.channelId || !partyId}
              onClick={addDialog.open}
            >
              Add item
            </Button>
          </div>
        }
      />

      <PageContent>
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailField label="Shopper" type="string" value={cart?.partyName} />
            <DetailField label="Items" type="number" value={cart?.itemCount ?? 0} />
            <DetailField label="Opened" type="dateTime" value={cart?.createdAt} />
            <DetailField label="Last changed" type="dateTime" value={cart?.updatedAt} />
            <DetailField
              label="Checkout"
              type="string"
              value={cart?.checkoutStartedAt ? 'In progress' : 'Not started'}
            />
          </div>
        </Card>

        <DataTable table={table} permission={permissions.view} />

        <DangerZone
          title="Close this basket"
          description="The lines go with it. Nothing is kept — a basket that has been paid for is recorded as an order, not as a basket."
          buttonText="Close basket"
          permission={permissions.delete}
          showWarning
          onClick={() => closeMutation.mutate(cartId)}
        />
      </PageContent>

      <Dialog
        handle={addDialog}
        icon={Plus}
        title="Add an item"
        description="Only what this outlet sells can be added."
        content={(close) => (
          <AddCartLineDialog
            binding={binding}
            cartId={cartId}
            partyId={partyId}
            channelId={cart?.channelId ?? ''}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
