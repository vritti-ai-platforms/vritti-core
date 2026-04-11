import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Folder, FolderOpen } from 'lucide-react';
import type React from 'react';
import type { CategoryData } from '@/schemas/categories';

interface CategoryRowProps extends TreeRenderItemParams {
  allCategories: CategoryData[];
}

// Custom tree row: folder icon (amber when expanded), name, Off badge and sub-count pill
export const CategoryRow: React.FC<CategoryRowProps> = ({ item, allCategories, isOpen }) => {
  const cat = allCategories.find((c) => c.id === item.id);
  const subCount = cat ? allCategories.filter((c) => c.parentId === cat.id).length : 0;
  const hasChildren = (item as TreeDataItem).children !== undefined;
  const FolderIcon = isOpen && hasChildren ? FolderOpen : Folder;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <FolderIcon className={`h-4 w-4 shrink-0 ${isOpen && hasChildren ? 'text-warning' : 'text-muted-foreground'}`} />
      <Typography variant="body2" className="truncate">
        {item.name}
      </Typography>
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {cat && !cat.isActive && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 leading-none bg-destructive/15 text-destructive border-destructive/25"
          >
            Off
          </Badge>
        )}
        {subCount > 0 && (
          <Badge variant="secondary" className="text-[10px] rounded-full px-1.5 py-0.5 leading-none">
            {subCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
