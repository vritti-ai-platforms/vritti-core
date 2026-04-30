import { Badge } from '@vritti/quantum-ui/Badge';
import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { Collapsible } from '@vritti/quantum-ui/Collapsible';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { useState } from 'react';
import { useModifierGroup } from '@/hooks/useModifierGroup';
import type { ItemModifierGroup, ModifierGroupData } from '@/schemas/items';
import { ModifierOptionRow } from './ModifierOptionRow';

interface ModifierGroupRowProps {
  group: ModifierGroupData;
  isSelected: boolean;
  assignedData: ItemModifierGroup | undefined;
  onToggleSelect: (groupId: string) => void;
}

export const ModifierGroupRow: React.FC<ModifierGroupRowProps> = ({
  group,
  isSelected,
  assignedData,
  onToggleSelect,
}) => {
  const [open, setOpen] = useState(false);
  const isAssigned = !!assignedData;
  // Fetch on-demand only for unassigned groups when the row is expanded
  const { data: fetchedDetail, isLoading: isFetchingDetail } = useModifierGroup(
    open && !isAssigned ? group.id : null,
  );
  const options = assignedData?.options ?? fetchedDetail?.options ?? [];
  const meta = formatSelectionMeta(group);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      headerClassName="px-3 py-2.5"
      leading={<Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(group.id)} />}
      trailing={meta ? <Typography variant="caption" className="shrink-0">{meta}</Typography> : null}
      trigger={
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0 text-left">
          <Typography variant="subtitle2" className="truncate">
            {group.name}
          </Typography>
          <Badge variant="outline" className="font-normal">
            {group.selectionType === 'SINGLE' ? 'Single' : 'Multi'}
          </Badge>
          {group.minSelections > 0 && (
            <Badge variant="secondary" className="font-normal">
              Required
            </Badge>
          )}
          {!group.isActive && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>
      }
    >
      <div className="border-t bg-muted/20 px-3 py-2 pl-10">
        {isFetchingDetail ? (
          <RowLoading />
        ) : options.length === 0 ? (
          <Typography variant="body2" intent="muted" className="block py-2">
            No options configured.
          </Typography>
        ) : (
          <div className="divide-y divide-border/50">
            {options.map((option) => (
              <ModifierOptionRow key={option.id} option={option} />
            ))}
          </div>
        )}
      </div>
    </Collapsible>
  );
};

const RowLoading: React.FC = () => (
  <div className="flex items-center gap-2 py-2">
    <Spinner className="size-4 text-muted-foreground" />
    <Typography variant="body2" intent="muted">
      Loading options…
    </Typography>
  </div>
);

// Builds the "Min N · Max N" selection meta string; empty string when neither bound applies
const formatSelectionMeta = (group: ModifierGroupData): string => {
  const parts: string[] = [];
  if (group.minSelections > 0) parts.push(`Min ${group.minSelections}`);
  if (group.maxSelections != null) parts.push(`Max ${group.maxSelections}`);
  return parts.join(' · ');
};
