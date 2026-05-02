import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useUomDimensions } from '@/hooks/uom-dimensions';

interface UomDimensionsPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const UomDimensionsPanel: React.FC<UomDimensionsPanelProps> = ({ selectedId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const { data: dimensions } = useUomDimensions(searchQuery);

  // Auto-select the first dimension on initial mount only — never re-select after a delete clears selection.
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (!selectedId && dimensions.length > 0) {
      hasAutoSelected.current = true;
      onSelect(dimensions[0].id);
    }
  }, [selectedId, dimensions, onSelect]);

  return (
    <PageContentPanel
      header={<Typography variant="overline">Dimensions</Typography>}
      contentClassName="flex flex-col p-0"
    >
      <div className="p-3 border-b shrink-0">
        <SearchBar
          placeholder="Search dimensions..."
          value={inputValue}
          onChange={setInputValue}
          onDebouncedChange={setSearchQuery}
          debounceMs={250}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {dimensions.length === 0 ? (
          <Empty
            icon={<Layers />}
            title={searchQuery ? 'No results' : 'No dimensions'}
            description={searchQuery ? 'Try a different search term' : 'Add a dimension to get started'}
            className="py-12"
          />
        ) : (
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
        )}
      </div>

    </PageContentPanel>
  );
};
