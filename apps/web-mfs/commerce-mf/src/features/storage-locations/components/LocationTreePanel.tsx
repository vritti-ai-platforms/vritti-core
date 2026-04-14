import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { TextField } from '@vritti/quantum-ui/TextField';
import type { TreeDataItem } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { ChevronsDownUp, ChevronsUpDown, FolderTree, MapPin, MapPinCheck, Search } from 'lucide-react';
import type React from 'react';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { LocationRow } from './LocationRow';

interface LocationTreePanelProps {
  locations: StorageLocationData[];
  treeData: TreeDataItem[];
  selectedId: string | null;
  searchQuery: string;
  expandAll: boolean;
  onSelect: (id: string | null) => void;
  onSearchChange: (q: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const LocationTreePanel: React.FC<LocationTreePanelProps> = ({
  locations,
  treeData,
  selectedId,
  searchQuery,
  expandAll,
  onSelect,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <div className="w-72 border-r flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b shrink-0 flex flex-col gap-2">
        <TextField
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          startAdornment={<Search className="size-3.5 text-muted-foreground" />}
        />
        {locations.length > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={onExpandAll}>
              <ChevronsUpDown className="size-3 mr-1" />
              Expand
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={onCollapseAll}>
              <ChevronsDownUp className="size-3 mr-1" />
              Collapse
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {treeData.length === 0 ? (
          <Empty
            icon={<FolderTree />}
            title={searchQuery ? 'No results' : 'No locations'}
            description={searchQuery ? 'Try a different search term' : 'Add a location to get started'}
            className="py-12"
          />
        ) : (
          <TreeView
            data={treeData}
            expandAll={expandAll}
            initialSelectedItemId={selectedId ?? undefined}
            onSelectChange={(item) => onSelect(item?.id ?? null)}
            renderItem={(params) => <LocationRow {...params} allLocations={locations} />}
            defaultNodeIcon={MapPinCheck}
            defaultLeafIcon={MapPin}
          />
        )}
      </div>
    </div>
  );
};
