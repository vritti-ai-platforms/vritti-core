import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import type { TreeDataItem } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { ChevronsDownUp, ChevronsUpDown, Folder, FolderOpen, FolderTree } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { CategoryData } from '@/schemas/categories';
import { CategoryRow } from './CategoryRow';

interface CategoryTreePanelProps {
  categories: CategoryData[];
  treeData: TreeDataItem[];
  selectedId: string | null;
  searchQuery: string;
  expandAll: boolean;
  isLoading: boolean;
  onSelect: (id: string | null) => void;
  onSearchChange: (q: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const CategoryTreePanel: React.FC<CategoryTreePanelProps> = ({
  categories,
  treeData,
  selectedId,
  searchQuery,
  expandAll,
  isLoading,
  onSelect,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  return (
    <div className="w-72 border-r flex flex-col shrink-0 overflow-hidden">
      {/* Search + actions */}
      <div className="p-3 border-b shrink-0 flex flex-col gap-2">
        <SearchBar
          placeholder="Search categories..."
          value={inputValue}
          onChange={setInputValue}
          onDebouncedChange={onSearchChange}
          debounceMs={250}
        />
        {categories.length > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={onExpandAll}>
              <ChevronsUpDown className="size-3 mr-1" />
              Expand
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={onCollapseAll}>
              <ChevronsDownUp className="size-3 mr-1" />
              Collapse
            </Button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : treeData.length === 0 ? (
          <Empty
            icon={<FolderTree />}
            title={searchQuery ? 'No results' : 'No categories'}
            description={searchQuery ? 'Try a different search term' : 'Add a category to get started'}
            className="py-12"
          />
        ) : (
          <TreeView
            data={treeData}
            expandAll={expandAll}
            initialSelectedItemId={selectedId ?? undefined}
            onSelectChange={(item) => onSelect(item?.id ?? null)}
            renderItem={(params) => <CategoryRow {...params} allCategories={categories} />}
            defaultNodeIcon={FolderOpen}
            defaultLeafIcon={Folder}
          />
        )}
      </div>
    </div>
  );
};
