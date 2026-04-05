import { Button } from '@vritti/quantum-ui/Button';
import { TextField } from '@vritti/quantum-ui/TextField';
import type { TreeDataItem } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Folder, FolderOpen, LayoutGrid, Search } from 'lucide-react';
import type React from 'react';
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
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="w-80 border-r flex flex-col shrink-0 overflow-hidden">
      {/* Panel header */}
      <div className="px-3 py-2.5 border-b shrink-0">
        <Typography variant="body2" className="font-medium">Categories</Typography>
        <Typography variant="caption" intent="muted" className="ml-2">
          {activeCount} active · {categories.length} total
        </Typography>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b shrink-0">
        <TextField
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          startAdornment={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Typography variant="body2" intent="muted">Loading…</Typography>
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <LayoutGrid className="h-8 w-8 opacity-30 text-muted-foreground" />
            <Typography variant="body2" intent="muted">
              {searchQuery ? 'No results' : 'No categories yet'}
            </Typography>
          </div>
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

      {/* Footer */}
      <div className="px-3 py-2 border-t flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onExpandAll}>Expand All</Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll}>Collapse All</Button>
      </div>
    </div>
  );
};
