import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Folder, FolderOpen, type LucideIcon, Tag } from 'lucide-react';
import type React from 'react';
import { type CategoryRole, CategoryRoleValues } from '@/schemas/categories';

// Static icon per category role (for detail fields / badges). The tree row uses FolderOpen when expanded.
export const CATEGORY_ROLE_ICON: Record<CategoryRole, LucideIcon> = {
  [CategoryRoleValues.GROUP]: Folder,
  [CategoryRoleValues.CATEGORY]: Tag,
};

// Custom tree row: role-based icon (folder for GROUP, tag for leaf CATEGORY), name, and child-count pill.
export const CategoryRow: React.FC<TreeRenderItemParams> = ({ item, isOpen }) => {
  const node = item as TreeDataItem & { categoryRole?: CategoryRole };
  const childCount = node.children?.length ?? 0;
  const hasChildren = node.children !== undefined;
  // Prefer the explicit role; fall back to has-children for backends that don't send it yet.
  const isGroup = node.categoryRole ? node.categoryRole === CategoryRoleValues.GROUP : hasChildren;

  const Icon = isGroup ? (isOpen ? FolderOpen : Folder) : Tag;
  const iconClass = isGroup && isOpen ? 'text-warning' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <Typography variant="body2" className="truncate">
        {item.name}
      </Typography>
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {childCount > 0 && (
          <Badge variant="secondary" className="text-[10px] rounded-full px-1.5 py-0.5 leading-none">
            {childCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
