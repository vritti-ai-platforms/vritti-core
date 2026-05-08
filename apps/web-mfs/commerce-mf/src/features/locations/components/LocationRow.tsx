import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MapPin, MapPinCheck } from 'lucide-react';
import type React from 'react';
export const LocationRow: React.FC<TreeRenderItemParams> = ({ item, isOpen }) => {
  const childCount = (item as TreeDataItem).children?.length ?? 0;
  const hasChildren = (item as TreeDataItem).children !== undefined;
  const Icon = isOpen && hasChildren ? MapPinCheck : MapPin;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Icon className={`h-4 w-4 shrink-0 ${isOpen && hasChildren ? 'text-warning' : 'text-muted-foreground'}`} />
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
