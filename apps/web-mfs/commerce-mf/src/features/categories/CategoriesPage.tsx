import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES_KEY, useCategoryById, useCategoryCount } from '@/hooks/categories';
import { CategoryDetailPanel, CategoryEmptyState, CategoryTreePanel } from './components';
import { AddCategoryDialog } from './forms/AddCategoryDialog';

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: categoryCount } = useCategoryCount();
  const { data: selectedCategory, isLoading: isSelectedCategoryLoading } = useCategoryById(selectedId);
  const formDialog = useDialog();

  function openAdd() {
    formDialog.open();
  }

  function invalidateCategories() {
    queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description={`${categoryCount?.count ?? 0} total categories`}
        actions={
          <Button onClick={openAdd} startAdornment={<Plus className="size-4" />}>
            Add Category
          </Button>
        }
      />

      <PageContent>
        <CategoryTreePanel selectedId={selectedId} onSelect={setSelectedId} />

        <div className="flex-1 overflow-auto p-6 min-w-0 flex flex-col">
          {selectedCategory ? (
            <CategoryDetailPanel category={selectedCategory} onSelectCategory={setSelectedId} />
          ) : selectedId && isSelectedCategoryLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading…</div>
          ) : (
            <CategoryEmptyState />
          )}
        </div>
      </PageContent>

      <Dialog
        handle={formDialog}
        title="Add Category"
        description="Enter the details for the new category."
        content={(close) => (
          <AddCategoryDialog
            onSuccess={() => {
              invalidateCategories();
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
