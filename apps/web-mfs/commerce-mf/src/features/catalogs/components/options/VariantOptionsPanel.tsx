import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers, Plus } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useVariantOptions } from '@/hooks/variant-options';

interface VariantOptionsPanelProps {
  catalogId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddOption: () => void;
}

export const VariantOptionsPanel: React.FC<VariantOptionsPanelProps> = ({
  catalogId,
  selectedId,
  onSelect,
  onAddOption,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: options = [], isLoading } = useVariantOptions(catalogId);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) => option.name.toLowerCase().includes(query));
  }, [options, searchQuery]);

  return (
    <PageContentPanel
      header={<SearchBar placeholder="Search options..." onDebouncedChange={setSearchQuery} debounceMs={250} />}
      headerClassName="shrink-0"
      actions={
        <Button size="sm" onClick={onAddOption} startAdornment={<Plus className="size-4" />}>
          Add Option
        </Button>
      }
      isLoading={isLoading}
      isEmpty={filteredOptions.length === 0}
      emptyState={
        <Empty
          icon={<Layers />}
          title={searchQuery ? 'No results' : 'No options'}
          description={searchQuery ? 'Try a different search term' : 'Add a variant option to get started'}
        />
      }
    >
      <div className="p-2 space-y-1">
        {filteredOptions.map((option) => (
          <SidePanelListItem key={option.id} active={selectedId === option.id} onClick={() => onSelect(option.id)}>
            <div className="flex items-center justify-between w-full gap-2">
              <Typography variant="body2" className="truncate font-medium">
                {option.name}
              </Typography>
              <Typography variant="caption" intent="muted" className="shrink-0">
                {pluralize('value', option.values.length, true)}
              </Typography>
            </div>
          </SidePanelListItem>
        ))}
      </div>
    </PageContentPanel>
  );
};
