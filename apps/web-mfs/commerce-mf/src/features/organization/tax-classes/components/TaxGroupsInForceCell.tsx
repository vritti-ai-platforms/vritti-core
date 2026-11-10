import { Badge } from '@vritti/quantum-ui/Badge';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { TriangleAlert } from 'lucide-react';
import type { TaxClassGroupInForce } from '@/schemas/tax-classes';

interface TaxGroupsInForceCellProps {
  taxGroups: TaxClassGroupInForce[];
}

// The tax groups a class is taxed by on the table's day, one badge per price slab; a warning when it has none
export const TaxGroupsInForceCell = ({ taxGroups }: TaxGroupsInForceCellProps) => {
  const fmt = useFormatters();

  if (taxGroups.length === 0) {
    return (
      <Tooltip content="No tax group in the chosen country on the chosen day, so items of this class can't be taxed then. Map one from the class's Groups tab.">
        <Badge variant="destructive" className="gap-1">
          <TriangleAlert className="size-3" />
          Not Mapped
        </Badge>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {taxGroups.map((group) => (
        <Badge key={`${group.taxGroupId}-${group.maxUnitPrice?.value ?? 'any'}`} variant="secondary" className="gap-1">
          {group.taxGroupName}
          {group.maxUnitPrice && (
            <span className="text-muted-foreground">≤ {fmt.currency(group.maxUnitPrice).primary}</span>
          )}
        </Badge>
      ))}
    </div>
  );
};
