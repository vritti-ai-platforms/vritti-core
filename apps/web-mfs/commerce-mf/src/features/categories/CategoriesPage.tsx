import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { parseSlug } from '@vritti/quantum-ui/utils/slug';
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useDeleteCategory } from '@/hooks/useDeleteCategory';
import { type CategoryData } from '@/schemas/categories';
import { CategoryForm } from './forms/CategoryForm';

function extractBuIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const buSegment = segments.find((s) => s.startsWith('bu-'));
  if (!buSegment) return null;
  const parsed = parseSlug(buSegment.replace(/^bu-/, ''));
  return parsed?.id ?? null;
}

export const CategoriesPage = () => {
  const location = useLocation();
  const selectedBuId = extractBuIdFromPath(location.pathname);

  const { data: categories = [], isLoading } = useCategories(selectedBuId);
  const deleteMutation = useDeleteCategory();
  const addDialog = useDialog();
  const confirm = useConfirm();

  async function handleDelete(id: string, name: string) {
    const confirmed = await confirm({
      title: `Delete "${name}"?`,
      description: 'This category will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(id);
  }

  const { table } = useDataTable({
    columns: getColumns(handleDelete, selectedBuId ?? ''),
    label: 'Category',
    slug: 'category',
    serverState: { result: categories, count: categories.length },
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Categories" description="Manage product categories for this business unit" />

      <DataTable
        table={table}
        isLoading={isLoading}
        enableViews={false}
        toolbarActions={{
          actions: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Category
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: LayoutGrid,
          title: 'No categories found',
          description: 'Add your first category to get started.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Category
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Category"
        description="Enter the details for the new category."
        content={(close) => (
          <CategoryForm businessUnitId={selectedBuId ?? ''} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};

function getColumns(
  onDelete: (id: string, name: string) => Promise<void>,
  businessUnitId: string,
): ColumnDef<CategoryData, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const { isActive } = row.original;
        return (
          <Badge variant={isActive ? 'secondary' : 'outline'} className={isActive ? 'bg-success/15 text-success' : ''}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'sortOrder',
      header: 'Sort Order',
      enableSorting: true,
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
                title: 'Edit Category',
                description: 'Update the details for this category.',
                content: (close) => (
                  <CategoryForm
                    category={row.original}
                    businessUnitId={businessUnitId}
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
