import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import type { CategoryData } from '@/schemas/categories';
import { CategoryDetailPanel, CategoryEmptyState, CategoryTreePanel } from './components';
import { CategoryForm } from './forms/CategoryForm';
import { filterTree, toTreeItems } from './utils';

export const CategoriesPage = () => {
  const { id: buId } = useSlugParams('buSlug');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useCategories(buId);

  const formDialog = useDialog();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<CategoryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;
  const activeCount = categories.filter((c) => c.isActive).length;

  const treeData = useMemo(() => {
    const tree = toTreeItems(categories);
    return searchQuery.trim() ? filterTree(tree, searchQuery) : tree;
  }, [categories, searchQuery]);

  function openAdd() {
    setFormCategory(null);
    formDialog.open();
  }

  function openEdit(cat: CategoryData) {
    setFormCategory(cat);
    formDialog.open();
  }

  function invalidateCategories() {
    queryClient.invalidateQueries({ queryKey: ['categories', buId] });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description={`${activeCount} active · ${categories.length} total categories`}
        actions={
          <Button onClick={openAdd} startAdornment={<Plus className="size-4" />}>
            Add Category
          </Button>
        }
      />

      <PageContent>
        <CategoryTreePanel
          categories={categories}
          treeData={treeData}
          selectedId={selectedId}
          searchQuery={searchQuery}
          expandAll={expandAll}
          isLoading={isLoading}
          onSelect={setSelectedId}
          onSearchChange={setSearchQuery}
          onExpandAll={() => setExpandAll(true)}
          onCollapseAll={() => setExpandAll(false)}
        />

        <div className="flex-1 overflow-auto p-6 min-w-0 flex flex-col">
          {selectedCategory ? (
            <CategoryDetailPanel
              category={selectedCategory}
              allCategories={categories}
              onEdit={() => openEdit(selectedCategory)}
              onSelectCategory={setSelectedId}
            />
          ) : (
            <CategoryEmptyState />
          )}
        </div>
      </PageContent>

      <Dialog
        handle={formDialog}
        title={formCategory ? 'Edit Category' : 'Add Category'}
        description={formCategory ? 'Update the details for this category.' : 'Enter the details for the new category.'}
        content={(close) => (
          <CategoryForm
            category={formCategory ?? undefined}
            businessUnitId={buId}
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
