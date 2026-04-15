import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import type { TreeReorderPayload } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { Folder, FolderOpen, FolderTree } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useCategoryTree, useReorderCategories } from '@/hooks/categories';
import { CategoryRow } from './CategoryRow';

interface CategoryTreePanelProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const CategoryTreePanel: React.FC<CategoryTreePanelProps> = ({ selectedId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const { data: treeData = [], isFetching } = useCategoryTree(searchQuery);
  const reorderMutation = useReorderCategories();
  const dragEnabled = searchQuery.trim().length === 0 && !reorderMutation.isPending;

  const handleReorder = useCallback(
    (payload: TreeReorderPayload) => {
      if (!dragEnabled) return;
      if (!payload.orderedIds?.length) return;
      reorderMutation.mutate(payload);
    },
    [dragEnabled, reorderMutation],
  );

  return (
    <PageContentPanel
      header={
        <SearchBar
          placeholder="Search categories..."
          value={inputValue}
          onChange={setInputValue}
          onDebouncedChange={setSearchQuery}
          debounceMs={250}
        />
      }
      headerClassName="shrink-0"
      content={
        !isFetching && treeData.length === 0 ? (
          <Empty
            icon={<FolderTree />}
            title={searchQuery ? 'No results' : 'No categories'}
            description={searchQuery ? 'Try a different search term' : 'Add a category to get started'}
            className="py-12"
          />
        ) : (
          <TreeView
            data={treeData}
            isLoading={isFetching}
            initialSelectedItemId={selectedId ?? undefined}
            onSelectChange={(item) => onSelect(item?.id ?? null)}
            onReorder={handleReorder}
            defaultDraggable={dragEnabled}
            defaultDroppable={dragEnabled}
            renderItem={(params) => <CategoryRow {...params} />}
            defaultNodeIcon={FolderOpen}
            defaultLeafIcon={Folder}
          />
        )
      }
    />
  );
};
