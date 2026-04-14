import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MapPin, MapPinCheck } from 'lucide-react';
import type React from 'react';
import type { StorageLocationData } from '@/schemas/storage-locations';

interface LocationRowProps extends TreeRenderItemParams {
  allLocations: StorageLocationData[];
}

export const LocationRow: React.FC<LocationRowProps> = ({ item, allLocations, isOpen }) => {
  const location = allLocations.find((entry) => entry.id === item.id);
  const childCount = location ? allLocations.filter((entry) => entry.parentId === location.id).length : 0;
  const hasChildren = (item as TreeDataItem).children !== undefined;
  const Icon = isOpen && hasChildren ? MapPinCheck : MapPin;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Icon className={`h-4 w-4 shrink-0 ${isOpen && hasChildren ? 'text-warning' : 'text-muted-foreground'}`} />
      <Typography variant="body2" className="truncate">
        {item.name}
      </Typography>
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {location && !location.isActive && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 leading-none bg-destructive/15 text-destructive border-destructive/25"
          >
            Off
          </Badge>
        )}
        {childCount > 0 && (
          <Badge variant="secondary" className="text-[10px] rounded-full px-1.5 py-0.5 leading-none">
            {childCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
