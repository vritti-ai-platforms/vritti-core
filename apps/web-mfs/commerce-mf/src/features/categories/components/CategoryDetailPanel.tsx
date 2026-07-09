import { useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '@vritti/commerce-permissions/categories';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { formatCategoryPath } from '@vritti/quantum-ui/selects/category';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Boxes, Eye, Folder, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  CATEGORY_CHILDREN_TABLE_KEY,
  CATEGORY_ITEMS_TABLE_KEY,
  useCategoryById,
  useCategoryChildrenTable,
  useCategoryItemsTable,
  useDeleteCategory,
} from '@/hooks/categories';
import { type CategoryData, type CategoryItemRow, CategoryRoleLabels, CategoryRoleValues } from '@/schemas/categories';
import { inventoryItemTypeConfig, inventoryTrackingConfig } from '@/schemas/inventory-items';
import { AddCategoryDialog } from '../forms/AddCategoryDialog';
import { EditCategoryDialog } from '../forms/EditCategoryDialog';
import { CategoryDetailPanelSkeleton } from './CategoryDetailPanelSkeleton';
import { CATEGORY_ROLE_ICON } from './CategoryRow';

interface CategoryDetailPanelProps {
  categoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryDetailPanel: React.FC<CategoryDetailPanelProps> = ({ categoryId, onSelectCategory }) => {
  const { data: category, isLoading } = useCategoryById(categoryId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!categoryId && (isLoading || !category)}
      loadingContent={<CategoryDetailPanelSkeleton />}
      isEmpty={!categoryId}
      emptyState={
        <Empty
          icon={<FolderTree />}
          title="Select a category"
          description="Click a category in the tree to view its details"
        />
      }
    >
      {category ? <CategoryDetailContent category={category} onSelectCategory={onSelectCategory} /> : null}
    </PageContentDetails>
  );
};

interface CategoryDetailContentProps {
  category: CategoryData;
  onSelectCategory: (id: string | null) => void;
}

const CategoryDetailContent: React.FC<CategoryDetailContentProps> = ({ category, onSelectCategory }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addChildDialog = useDialog();
  const editDialog = useDialog();
  const deleteMutation = useDeleteCategory();
  const isGroup = category.categoryRole === CategoryRoleValues.GROUP;
  const RoleIcon = CATEGORY_ROLE_ICON[category.categoryRole];
  const { data: childrenResponse, isLoading: isChildrenLoading } = useCategoryChildrenTable(
    isGroup ? category.id : null,
  );

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
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => onSelectCategory(row.original.id) }]}
          />
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
    slug: `category-${category.id}-children`,
    label: 'child category',
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CATEGORY_CHILDREN_TABLE_KEY(category.id) }),
  });

  const handleDelete = async () => {
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
      <DetailHeader
        title={category.name}
        badges={
          <>
            <Badge
              variant={category.isActive ? 'secondary' : 'outline'}
              className={category.isActive ? 'bg-success/15 text-success' : ''}
            >
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">{CategoryRoleLabels[category.categoryRole]}</Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={editDialog.open}
              startAdornment={<Pencil className="size-3.5" />}
              permission={CATEGORIES.edit}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!category.canDelete || deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
              startAdornment={<Trash2 className="size-3.5" />}
              permission={CATEGORIES.delete}
            >
              Delete
            </Button>
          </>
        }
      />

      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Sort Order" type="number" value={category.sortOrder} />
          <DetailField
            className="px-4 py-2"
            label="Role"
            type="string"
            value={
              <span className="flex items-center gap-1.5">
                <RoleIcon className="size-4 text-muted-foreground" />
                {CategoryRoleLabels[category.categoryRole]}
              </span>
            }
          />
          <DetailField
            className="px-4 py-2"
            label="Parent"
            type="string"
            value={category.path ? formatCategoryPath(category.path) : null}
          />
        </DetailSection>
      </div>

      {isGroup ? (
        <div>
          <Typography variant="overline" intent="muted" className="mb-3">
            Child Categories ({childrenResponse?.count ?? 0})
          </Typography>
          <DataTable
            table={table}
            mode="compact"
            isLoading={isChildrenLoading}
            permission={CATEGORIES.view}
            toolbarActions={{
              actions: (
                <Button
                  size="sm"
                  startAdornment={<Plus className="size-4" />}
                  onClick={addChildDialog.open}
                  permission={CATEGORIES.add}
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
      ) : (
        <CategoryItemsSection categoryId={category.id} />
      )}

      <Dialog
        handle={addChildDialog}
        icon={FolderTree}
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
        icon={FolderTree}
        title="Edit Category"
        description="Update the details for this category."
        content={(close) => <EditCategoryDialog category={category} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};

interface CategoryItemsSectionProps {
  categoryId: string;
}

const CategoryItemsSection: React.FC<CategoryItemsSectionProps> = ({ categoryId }) => {
  const queryClient = useQueryClient();
  const { data: itemsResponse, isLoading } = useCategoryItemsTable(categoryId);

  const columns = useMemo<ColumnDef<CategoryItemRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Item',
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = inventoryItemTypeConfig[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'tracking',
        header: 'Tracking',
        cell: ({ row }) => inventoryTrackingConfig[row.original.tracking].label,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UoM',
        cell: ({ row }) => <StringCell value={row.original.uomSymbol} />,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    serverState: itemsResponse,
    slug: `category-${categoryId}-items`,
    label: 'item',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_ITEMS_TABLE_KEY(categoryId) });
    },
  });

  return (
    <div>
      <Typography variant="overline" intent="muted" className="mb-3">
        Items ({itemsResponse?.count ?? 0})
      </Typography>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        permission={CATEGORIES.inventoryItems.view}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No items in this category',
          description: 'No inventory items are assigned to this category yet.',
        }}
      />
    </div>
  );
};
