import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useItemModifiers } from '@/hooks/useItemModifiers';
import { useModifierGroup } from '@/hooks/useModifierGroup';
import { useModifierGroups } from '@/hooks/useModifierGroups';
import { useSaveItemModifiers } from '@/hooks/useSaveItemModifiers';
import type { ItemDetail, ItemModifierGroup, ModifierGroupData, ModifierOptionData } from '@/schemas/items';

interface ModifiersTabProps {
  item: ItemDetail;
}

interface ModifierGroupRowProps {
  group: ModifierGroupData;
  isSelected: boolean;
  assignedData: ItemModifierGroup | undefined;
  onToggle: (groupId: string) => void;
}

// Formats additional price as currency string
function formatPrice(price: string): string {
  const num = Number.parseFloat(price);
  if (num === 0) return '';
  return `+\u20B9${num.toFixed(2)}`;
}

// Renders a single option row with name and additional price
const OptionRow: React.FC<{ option: ModifierOptionData }> = ({ option }) => {
  const priceStr = formatPrice(option.additionalPrice);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{option.name}</span>
      {priceStr && (
        <>
          <span className="text-muted-foreground/60">&mdash;</span>
          <span>{priceStr}</span>
        </>
      )}
      {!option.isAvailable && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Unavailable
        </Badge>
      )}
    </div>
  );
};

// Renders a modifier group with expand/collapse for option details
const ModifierGroupRow: React.FC<ModifierGroupRowProps> = ({ group, isSelected, assignedData, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAssigned = !!assignedData;

  // Only fetch when expanded and not already assigned (assigned data includes options)
  const { data: fetchedDetail, isLoading: isFetchingDetail } = useModifierGroup(
    isExpanded && !isAssigned ? group.id : null,
  );

  // Use assigned data options if available, otherwise use fetched detail
  const options = assignedData?.options ?? fetchedDetail?.options ?? [];

  return (
    <div className="rounded-lg border">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(group.id)} />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{group.name}</span>
            <Badge variant="outline" className="text-xs">
              {group.selectionType === 'SINGLE' ? 'Single' : 'Multi'}
            </Badge>
            {group.minSelections > 0 && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
            {!group.isActive && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Min: {group.minSelections}
            {group.maxSelections != null && ` / Max: ${group.maxSelections}`}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setIsExpanded((prev) => !prev)}>
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3 pl-10">
          {isFetchingDetail ? (
            <div className="flex items-center gap-2 py-1">
              <Spinner className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading options...</span>
            </div>
          ) : options.length === 0 ? (
            <span className="text-sm text-muted-foreground">No options configured.</span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {options.map((option) => (
                <OptionRow key={option.id} option={option} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ModifiersTab: React.FC<ModifiersTabProps> = ({ item }) => {
  const { data: allGroups = [], isLoading: groupsLoading } = useModifierGroups(item.businessUnitId);
  const { data: assignedModifiers = [], isLoading: modifiersLoading } = useItemModifiers(item.id);
  const saveMutation = useSaveItemModifiers();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync selected state when assigned modifiers load
  useEffect(() => {
    setSelectedIds(new Set(assignedModifiers.map((m) => m.id)));
  }, [assignedModifiers]);

  // Toggles a modifier group selection
  const handleToggle = useCallback((groupId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Saves the current selection
  const handleSave = useCallback(() => {
    saveMutation.mutate({
      itemId: item.id,
      groupIds: Array.from(selectedIds),
    });
  }, [item.id, selectedIds, saveMutation]);

  // Build a lookup map for assigned modifier data by group ID
  const assignedMap = new Map(assignedModifiers.map((m) => [m.id, m]));

  const isLoading = groupsLoading || modifiersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Modifier Groups</CardTitle>
          <Button
            variant="outline"
            size="sm"
            startAdornment={<Save className="size-4" />}
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Spinner className="size-4" /> : 'Save'}
          </Button>
        </CardHeader>
        <CardContent>
          {allGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No modifier groups available. Create modifier groups first to assign them to items.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {allGroups.map((group) => (
                <ModifierGroupRow
                  key={group.id}
                  group={group}
                  isSelected={selectedIds.has(group.id)}
                  assignedData={assignedMap.get(group.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
