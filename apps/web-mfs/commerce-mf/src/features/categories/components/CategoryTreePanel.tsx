import { Empty } from '@vritti/quantum-ui/Empty';
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
    <div className="w-72 border-r flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b shrink-0 flex flex-col gap-2">
        <SearchBar
          placeholder="Search categories..."
          value={inputValue}
          onChange={setInputValue}
          onDebouncedChange={setSearchQuery}
          debounceMs={250}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {!isFetching && treeData.length === 0 ? (
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
        )}
      </div>
    </div>
  );
};
