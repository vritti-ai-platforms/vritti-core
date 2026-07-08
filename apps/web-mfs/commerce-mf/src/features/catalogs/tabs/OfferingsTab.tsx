import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { CategoryFilter } from '@vritti/quantum-ui/selects/category';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { BookOpen, Eye, Package, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OFFERINGS_TABLE_KEY, useDeleteOffering, useOfferingsTable } from '@/hooks/offerings';
import type { CatalogData } from '@/schemas/catalogs';
import { FULFILMENT_TYPE_OPTIONS, type OfferingData } from '@/schemas/offerings';
import { AddOfferingDialog } from '../forms/offerings/AddOfferingDialog';

interface OfferingsTabProps {
  catalog: CatalogData;
}

export const OfferingsTab: React.FC<OfferingsTabProps> = ({ catalog }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalogId = catalog.id;

  const { data: response, isLoading } = useOfferingsTable(catalogId);
  const deleteMutation = useDeleteOffering();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This offering will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate({ catalogId, offeringId: id });
    },
    [confirm, deleteMutation, catalogId],
  );

  const { table } = useDataTable({
    columns: getColumns({
      onView: (offering) => navigate(buildSlug(offering.name, offering.id)),
      onDelete: handleDelete,
    }),
    slug: 'commerce-offerings',
    label: 'offering',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: OFFERINGS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        searchConfig={{
          columns: [{ id: 'name', label: 'Name' }],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="fulfilmentType"
            name="fulfilmentType"
            label="Type"
            placeholder="All types"
            options={FULFILMENT_TYPE_OPTIONS}
          />,
          <CategoryFilter key="categoryId" />,
        ]}
        toolbarActions={{
          actions: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Offering
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No offerings found',
          description: 'Add your first offering to get started.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Offering
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={BookOpen}
        title="Add Offering"
        description="Pick what you're selling, then add its details. Single-variant types set price now; stocked-with-variants adds variants after creation."
        className="max-w-3xl"
        content={(close) => (
          <AddOfferingDialog
            catalogId={catalogId}
            currencyCode={catalog.currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};

interface ColumnActions {
  onView: (offering: OfferingData) => void;
  onDelete: (id: string, name: string) => Promise<void>;
}

const FULFILMENT_LABELS: Record<OfferingData['fulfilmentType'], string> = {
  STOCK: 'Stocked',
  SERVICE: 'Service',
  COMPOSITE: 'Composite',
};

function getColumns({ onView, onDelete }: ColumnActions): ColumnDef<OfferingData, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) =>
        row.original.categoryName ? (
          <Badge variant="outline">{row.original.categoryName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: 'fulfilmentType',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{FULFILMENT_LABELS[row.original.fulfilmentType]}</Badge>,
      enableSorting: false,
    },
    {
      accessorKey: 'isAvailable',
      header: 'Status',
      cell: ({ row }) => {
        const { isAvailable } = row.original;
        return (
          <Badge
            variant={isAvailable ? 'secondary' : 'outline'}
            className={isAvailable ? 'bg-success/15 text-success' : ''}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        );
      },
      enableSorting: false,
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
              onClick: () => onView(row.original),
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              onClick: () => onDelete(row.original.id, row.original.name),
            },
          ]}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
