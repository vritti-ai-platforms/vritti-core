import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers, Plus } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useModifierGroups } from '@/hooks/modifiers';

interface ModifierGroupsPanelProps {
  catalogId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddGroup: () => void;
}

export const ModifierGroupsPanel: React.FC<ModifierGroupsPanelProps> = ({
  catalogId,
  selectedId,
  onSelect,
  onAddGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: groups = [], isLoading } = useModifierGroups(catalogId);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((group) => group.name.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  return (
    <PageContentPanel
      header={<SearchBar placeholder="Search groups..." onDebouncedChange={setSearchQuery} debounceMs={250} />}
      headerClassName="shrink-0"
      actions={
        <Button size="sm" onClick={onAddGroup} startAdornment={<Plus className="size-4" />}>
          Add Group
        </Button>
      }
      isLoading={isLoading}
      isEmpty={filteredGroups.length === 0}
      emptyState={
        <Empty
          icon={<Layers />}
          title={searchQuery ? 'No results' : 'No modifier groups'}
          description={searchQuery ? 'Try a different search term' : 'Add a group to get started'}
        />
      }
    >
      <div className="p-2 space-y-1">
        {filteredGroups.map((group) => (
          <SidePanelListItem key={group.id} active={selectedId === group.id} onClick={() => onSelect(group.id)}>
            <div className="flex items-center justify-between w-full gap-2">
              <Typography variant="body2" className="truncate font-medium">
                {group.name}
              </Typography>
              <div className="flex items-center gap-1.5 shrink-0">
                {group.minSelections > 0 && <Badge variant="secondary">Required</Badge>}
                <Badge variant="outline">{group.selectionType === 'SINGLE' ? 'Single' : 'Multi'}</Badge>
              </div>
            </div>
          </SidePanelListItem>
        ))}
      </div>
    </PageContentPanel>
  );
};
