import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Box, type LucideIcon, MapPin, PackageCheck, Warehouse } from 'lucide-react';
import type React from 'react';
import { type LocationRole, LocationRoleValues } from '@/schemas/locations';

// Icon per location role: zone is a container, storage/reserved are leaf bins.
export const LOCATION_ROLE_ICON: Record<LocationRole, LucideIcon> = {
  [LocationRoleValues.ZONE]: Warehouse,
  [LocationRoleValues.STORAGE]: Box,
  [LocationRoleValues.RESERVED_STORAGE]: PackageCheck,
};

// Custom tree row: role-based icon, name, and child-count pill.
export const LocationRow: React.FC<TreeRenderItemParams> = ({ item, isOpen }) => {
  const node = item as TreeDataItem & { locationRole?: LocationRole };
  const childCount = node.children?.length ?? 0;
  const isZone = node.locationRole === LocationRoleValues.ZONE;

  // Prefer the explicit role icon; fall back to MapPin for backends that don't send the role yet.
  const Icon = node.locationRole ? LOCATION_ROLE_ICON[node.locationRole] : MapPin;
  const iconClass = isZone && isOpen ? 'text-warning' : 'text-muted-foreground';

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
