import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Sliders } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useItemModifiers, useSaveItemModifiers } from '@/hooks/items';
import { useModifierGroups } from '@/hooks/modifiers';
import type { ItemDetail } from '@/schemas/items';
import { ModifierGroupRow } from './components/ModifierGroupRow';

interface ModifiersTabProps {
  item: ItemDetail;
}

export const ModifiersTab: React.FC<ModifiersTabProps> = ({ item }) => {
  const { data: allGroups = [], isLoading: groupsLoading } = useModifierGroups(item.businessUnitId);
  const { data: assignedModifiers = [], isLoading: modifiersLoading } = useItemModifiers(item.id);
  const saveMutation = useSaveItemModifiers();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync local selection with server state on load/refresh
  useEffect(() => {
    setSelectedIds(new Set(assignedModifiers.map((m) => m.id)));
  }, [assignedModifiers]);

  const assignedMap = useMemo(() => new Map(assignedModifiers.map((m) => [m.id, m])), [assignedModifiers]);

  const isDirty = useMemo(() => {
    const serverIds = assignedModifiers.map((m) => m.id);
    if (serverIds.length !== selectedIds.size) return true;
    return serverIds.some((id) => !selectedIds.has(id));
  }, [assignedModifiers, selectedIds]);

  const toggleSelect = useCallback((groupId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  if (groupsLoading || modifiersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const handleSave = () => saveMutation.mutate({ itemId: item.id, groupIds: Array.from(selectedIds) });
  const handleDiscard = () => setSelectedIds(new Set(assignedModifiers.map((m) => m.id)));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Typography variant="subtitle2">Modifier groups</Typography>
        <Typography variant="caption">
          Select which modifier groups apply to this item.{' '}
          <span className="font-medium text-foreground">{selectedIds.size}</span> of {allGroups.length} selected.
        </Typography>
      </div>

      {allGroups.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y">
            {allGroups.map((group) => (
              <ModifierGroupRow
                key={group.id}
                group={group}
                isSelected={selectedIds.has(group.id)}
                assignedData={assignedMap.get(group.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </Card>
      )}

      {isDirty && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <Typography variant="body2" intent="muted">
            Unsaved changes
          </Typography>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} isLoading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
    <Sliders className="size-6 text-muted-foreground" />
    <Typography variant="body2" intent="muted">
      No modifier groups available
    </Typography>
  </div>
);
