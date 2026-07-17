import { Badge } from '@vritti/quantum-ui/Badge';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Building2, Globe, Landmark, type LucideIcon, Map, MapPin } from 'lucide-react';
import type React from 'react';
import { type TaxJurisdictionLevel, TaxJurisdictionLevelValues } from '@/schemas/tax-jurisdictions';

// Static icon per jurisdiction level, broad to narrow.
export const JURISDICTION_LEVEL_ICON: Record<TaxJurisdictionLevel, LucideIcon> = {
  [TaxJurisdictionLevelValues.COUNTRY]: Globe,
  [TaxJurisdictionLevelValues.STATE]: Map,
  [TaxJurisdictionLevelValues.COUNTY]: Landmark,
  [TaxJurisdictionLevelValues.CITY]: Building2,
  [TaxJurisdictionLevelValues.DISTRICT]: MapPin,
};

// Custom tree row: level-based icon, name, and child-count pill.
export const JurisdictionRow: React.FC<TreeRenderItemParams> = ({ item }) => {
  const node = item as TreeDataItem & { level?: TaxJurisdictionLevel };
  const childCount = node.children?.length ?? 0;
  const Icon = node.level ? JURISDICTION_LEVEL_ICON[node.level] : Map;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Typography variant="body2" className="truncate">
        {item.name}
      </Typography>
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {childCount > 0 && (
          <Badge variant="secondary" className="text-xs rounded-full px-1.5 py-0.5 leading-none">
            {childCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
