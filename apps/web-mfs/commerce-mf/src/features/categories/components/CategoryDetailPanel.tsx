import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Folder, Image, Pencil } from 'lucide-react';
import type React from 'react';
import type { CategoryData } from '@/schemas/categories';

interface CategoryDetailPanelProps {
  category: CategoryData;
  allCategories: CategoryData[];
  onEdit: () => void;
  onSelectCategory: (id: string) => void;
}

export const CategoryDetailPanel: React.FC<CategoryDetailPanelProps> = ({
  category,
  allCategories,
  onEdit,
  onSelectCategory,
}) => {
  const subCategories = allCategories.filter((c) => c.parentId === category.id);
  const parent = allCategories.find((c) => c.id === category.parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Typography variant="h3">{category.name}</Typography>
          <Badge
            variant={category.isActive ? 'secondary' : 'outline'}
            className={category.isActive ? 'bg-success/15 text-success' : ''}
          >
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Image placeholder */}
      <div className="border rounded-lg flex flex-col items-center justify-center h-48 bg-muted/30 gap-2">
        <Image className="h-8 w-8 opacity-40 text-muted-foreground" />
        <Typography variant="body2" intent="muted">
          No image
        </Typography>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Sort Order
          </Typography>
          <Typography variant="body2" className="font-medium">
            {category.sortOrder}
          </Typography>
        </div>
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Sub-categories
          </Typography>
          <Typography variant="body2" className="font-medium">
            {subCategories.length}
          </Typography>
        </div>
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Parent
          </Typography>
          <Typography variant="body2" className="font-medium">
            {parent?.name ?? '—'}
          </Typography>
        </div>
      </div>

      {/* Sub-categories list */}
      {subCategories.length > 0 && (
        <div>
          <Typography variant="overline" intent="muted" className="mb-3">
            Sub-categories ({subCategories.length})
          </Typography>
          <div className="space-y-1">
            {subCategories.map((sub) => (
              <Button
                key={sub.id}
                variant="outline"
                onClick={() => onSelectCategory(sub.id)}
                className="w-full justify-between px-3 py-2.5 h-auto font-normal"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Typography variant="body2" className="truncate">
                    {sub.name}
                  </Typography>
                </div>
                <Badge
                  variant={sub.isActive ? 'secondary' : 'outline'}
                  className={`text-xs shrink-0 ${sub.isActive ? 'bg-success/15 text-success' : ''}`}
                >
                  {sub.isActive ? 'active' : 'inactive'}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
