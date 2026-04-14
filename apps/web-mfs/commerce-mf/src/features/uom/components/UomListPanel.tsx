import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Ruler } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { UomData } from '@/schemas/uom';

interface UomListPanelProps {
  baseUnits: UomData[];
  selectedId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  onSearch: (q: string) => void;
}

export const UomListPanel: React.FC<UomListPanelProps> = ({
  baseUnits,
  selectedId,
  searchQuery,
  onSelect,
  onSearch,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  return (
    <div className="w-72 border-r flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b shrink-0">
        <SearchBar
          placeholder="Search units..."
          value={inputValue}
          onChange={setInputValue}
          onDebouncedChange={onSearch}
          debounceMs={250}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {baseUnits.length === 0 ? (
          <Empty
            icon={<Ruler />}
            title={searchQuery ? 'No results' : 'No base units'}
            description={searchQuery ? 'Try a different search term' : 'Add a base unit to get started'}
            className="py-12"
          />
        ) : (
          <div className="p-2 space-y-0.5">
            {baseUnits.map((unit) => (
              <Button
                key={unit.id}
                variant={selectedId === unit.id ? 'secondary' : 'ghost'}
                onClick={() => onSelect(unit.id)}
                className="w-full justify-start px-3 py-2.5 h-auto font-normal"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Ruler className="size-4 shrink-0 text-muted-foreground" />
                  <Typography variant="body2" className="truncate">
                    {unit.name}
                  </Typography>
                </div>
                <Badge variant="outline" className="text-xs shrink-0 ml-2 font-mono">
                  {unit.symbol}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
