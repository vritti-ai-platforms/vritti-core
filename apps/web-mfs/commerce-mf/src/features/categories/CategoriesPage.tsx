import { useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '@vritti/commerce-permissions/categories';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { FolderTree, Plus } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES_KEY, useCategoryCount } from '@/hooks/categories';
import { CategoryDetailPanel, CategoryTreePanel } from './components';
import { AddCategoryDialog } from './forms/AddCategoryDialog';

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: categoryCount } = useCategoryCount();
  const formDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description={categoryCount ? `${categoryCount.count} total categories` : undefined}
        actions={
          <Button onClick={formDialog.open} startAdornment={<Plus className="size-4" />} permission={CATEGORIES.add}>
            Add Category
          </Button>
        }
      />

      <PageContent>
        <PermissionGate permission={CATEGORIES.view}>
          <CategoryTreePanel selectedId={selectedId} onSelect={setSelectedId} />
          <CategoryDetailPanel categoryId={selectedId} onSelectCategory={setSelectedId} />
        </PermissionGate>
      </PageContent>

      <Dialog
        handle={formDialog}
        icon={FolderTree}
        title="Add Category"
        description="Enter the details for the new category."
        content={(close) => (
          <AddCategoryDialog
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
