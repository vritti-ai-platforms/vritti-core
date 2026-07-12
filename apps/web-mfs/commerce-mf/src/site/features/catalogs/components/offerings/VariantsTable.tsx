import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { BookOpen, Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { OfferingDetail, OfferingVariant } from '@/schemas/offerings';
import { useDeleteVariant } from '@/site/hooks/offerings';
import { VariantFormDialog } from '../../forms/offerings/VariantFormDialog';

interface VariantsTableProps {
  catalogId: string;
  offering: OfferingDetail;
}

export const VariantsTable: React.FC<VariantsTableProps> = ({ catalogId, offering }) => {
  const confirm = useConfirm();
  const addDialog = useDialog();
  const deleteMutation = useDeleteVariant();
  const showComponents = offering.fulfilmentType === 'STOCK' || offering.fulfilmentType === 'COMPOSITE';

  const handleDelete = useCallback(
    async (variant: OfferingVariant) => {
      const confirmed = await confirm({
        title: 'Delete variant?',
        description: `Delete "${variant.name}"?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate({ catalogId, offeringId: offering.id, variantId: variant.id });
    },
    [confirm, deleteMutation, catalogId, offering.id],
  );

  const columns = useMemo<ColumnDef<OfferingVariant>[]>(() => {
    const optionColumns: ColumnDef<OfferingVariant>[] = offering.options.map((option) => ({
      id: `option-${option.id}`,
      header: option.name,
      cell: ({ row }) => {
        const selected = option.values.find((value) => row.original.optionValueIds.includes(value.id));
        return selected?.value ?? '—';
      },
    }));

    const componentsColumn: ColumnDef<OfferingVariant>[] = showComponents
      ? [
          {
            id: 'components',
            header: 'Components',
            cell: ({ row }) => {
              const components = row.original.components;
              if (components.length === 0) return '—';
              const [first, ...rest] = components;
              const name = first.inventoryItemName ?? 'Item';
              return `${name} ×${first.quantity}${rest.length > 0 ? ` +${rest.length}` : ''}`;
            },
          },
        ]
      : [];

    return [
      ...optionColumns,
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
      },
      ...componentsColumn,
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <CurrencyCell value={row.original.price} />,
      },
      {
        accessorKey: 'isAvailable',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isAvailable ? 'success' : 'secondary'}>
            {row.original.isAvailable ? 'Available' : 'Hidden'}
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
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                dialog: {
                  title: 'Edit variant',
                  description: `Update pricing and availability for "${row.original.name}".`,
                  content: (close) => (
                    <VariantFormDialog
                      catalogId={catalogId}
                      offering={offering}
                      variant={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, [offering, showComponents, catalogId, handleDelete]);

  const { table } = useDataTable({
    columns,
    serverState: { result: offering.variants },
    slug: `offering-${offering.id}-variants`,
    label: 'variant',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        toolbarActions={{
          actions: (
            <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add variant
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No variants',
          description: 'Add a variant to make this offering sellable.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add variant
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={BookOpen}
        title="Add variant"
        description="Pick a combination, set its price and availability."
        content={(close) => (
          <VariantFormDialog catalogId={catalogId} offering={offering} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
