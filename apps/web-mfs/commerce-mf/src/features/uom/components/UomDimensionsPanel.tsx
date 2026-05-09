import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useUomDimensions } from '@/hooks/uom-dimensions';

interface UomDimensionsPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const UomDimensionsPanel: React.FC<UomDimensionsPanelProps> = ({ selectedId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: dimensions = [], isFetching } = useUomDimensions(searchQuery);

  return (
    <PageContentPanel
      header={<SearchBar placeholder="Search dimensions..." onDebouncedChange={setSearchQuery} debounceMs={250} />}
      headerClassName="shrink-0"
      isLoading={isFetching}
      isEmpty={dimensions.length === 0}
      emptyState={
        <Empty
          icon={<Layers />}
          title={searchQuery ? 'No results' : 'No dimensions'}
          description={searchQuery ? 'Try a different search term' : 'Add a dimension to get started'}
        />
      }
    >
      <div className="p-2 space-y-1">
        {dimensions.map((dimension) => (
          <SidePanelListItem
            key={dimension.id}
            active={selectedId === dimension.id}
            onClick={() => onSelect(dimension.id)}
          >
            <Typography variant="body2" className="truncate font-medium">
              {dimension.name}
            </Typography>
          </SidePanelListItem>
        ))}
      </div>
    </PageContentPanel>
  );
};
