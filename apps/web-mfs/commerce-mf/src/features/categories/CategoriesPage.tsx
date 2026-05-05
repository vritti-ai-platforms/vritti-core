import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
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
        description={`${categoryCount.count} total categories`}
        actions={
          <Button onClick={formDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Category
          </Button>
        }
      />

      <PageContent>
        <CategoryTreePanel selectedId={selectedId} onSelect={setSelectedId} />

        <PageContentDetails className="flex flex-col">
          {selectedId ? (
            <CategoryDetailPanel categoryId={selectedId} onSelectCategory={setSelectedId} />
          ) : (
            <Empty
              icon={<FolderTree />}
              title="Select a category"
              description="Click a category in the tree to view its details"
              className="flex-1"
            />
          )}
        </PageContentDetails>
      </PageContent>

      <Dialog
        handle={formDialog}
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
