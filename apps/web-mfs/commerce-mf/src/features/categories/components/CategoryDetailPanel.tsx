import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { formatCategoryPath } from '@vritti/quantum-ui/selects/category';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Folder, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  CATEGORY_CHILDREN_TABLE_KEY,
  useCategoryById,
  useCategoryChildrenTable,
  useDeleteCategory,
} from '@/hooks/categories';
import type { CategoryData } from '@/schemas/categories';
import { AddCategoryDialog } from '../forms/AddCategoryDialog';
import { EditCategoryDialog } from '../forms/EditCategoryDialog';

interface CategoryDetailPanelProps {
  categoryId: string;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryDetailPanel: React.FC<CategoryDetailPanelProps> = ({ categoryId, onSelectCategory }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addChildDialog = useDialog();
  const editDialog = useDialog();
  const deleteMutation = useDeleteCategory();
  const { data: category, isLoading } = useCategoryById(categoryId);
  const { data: childrenResponse, isLoading: isChildrenLoading } = useCategoryChildrenTable(categoryId);

  const columns = useMemo<ColumnDef<CategoryData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'sortOrder',
        header: 'Sort Order',
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (row.original.isActive ? 'Active' : 'Inactive'),
      },
      {
        id: 'open',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => onSelectCategory(row.original.id)}>
            Open
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onSelectCategory],
  );

  const { table } = useDataTable({
    columns,
    serverState: childrenResponse,
    slug: `category-${categoryId}-children`,
    label: 'child category',
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CATEGORY_CHILDREN_TABLE_KEY(categoryId) }),
  });

  const handleDelete = async () => {
    if (!category) return;
    const confirmed = await confirm({
      title: `Delete "${category.name}"?`,
      description: 'This category will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(category.id, {
        onSuccess: () => onSelectCategory(category.parentId),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {category ? (
          <div className="flex items-center gap-3 flex-wrap">
            <Typography variant="h3">{category.name}</Typography>
            <Badge
              variant={category.isActive ? 'secondary' : 'outline'}
              className={category.isActive ? 'bg-success/15 text-success' : ''}
            >
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-16" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={editDialog.open}
            disabled={!category}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!category || !category.canDelete || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <DetailField label="Sort Order" value={category?.sortOrder} loading={!category} />
        <DetailField label="Child Categories" value={childrenResponse?.count ?? 0} loading={!category} />
        <DetailField
          label="Parent"
          value={category?.path ? formatCategoryPath(category.path) || '—' : '—'}
          loading={!category}
        />
      </div>

      <div>
        <Typography variant="overline" intent="muted" className="mb-3">
          Child Categories ({childrenResponse?.count ?? 0})
        </Typography>
        <DataTable
          table={table}
          mode="compact"
          isLoading={isLoading || isChildrenLoading}
          toolbarActions={{
            actions: (
              <Button
                size="sm"
                disabled={!category}
                startAdornment={<Plus className="size-4" />}
                onClick={addChildDialog.open}
              >
                Add Child Category
              </Button>
            ),
          }}
          emptyStateConfig={{
            icon: Folder,
            title: 'No child categories',
            description: 'This category has no direct children.',
          }}
        />
      </div>

      {category ? (
        <>
          <Dialog
            handle={addChildDialog}
            title="Add Child Category"
            description={`Add a child category under "${category.name}".`}
            content={(close) => (
              <AddCategoryDialog
                defaultParentId={category.id}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: CATEGORY_CHILDREN_TABLE_KEY(category.id) });
                  close();
                }}
                onCancel={close}
              />
            )}
          />

          <Dialog
            handle={editDialog}
            title="Edit Category"
            description="Update the details for this category."
            content={(close) => <EditCategoryDialog category={category} onSuccess={close} onCancel={close} />}
          />
        </>
      ) : null}
    </div>
  );
};
