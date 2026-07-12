import { SITE_LOCATIONS } from '@vritti/commerce-permissions/locations';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import type { TreeReorderPayload } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { FolderTree, MapPin, MapPinCheck } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useLocationTree, useReorderLocations } from '@/hooks/site/locations';
import { LocationRow } from './LocationRow';

interface LocationTreePanelProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const LocationTreePanel: React.FC<LocationTreePanelProps> = ({ selectedId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: treeData = [], isLoading } = useLocationTree(searchQuery);
  const reorderMutation = useReorderLocations();
  const { available: canReorder } = usePermission(SITE_LOCATIONS.edit);
  const dragEnabled = canReorder && searchQuery.trim().length === 0 && !reorderMutation.isPending;

  const handleReorder = useCallback(
    (payload: TreeReorderPayload) => {
      if (!dragEnabled) return;
      if (!payload.orderedIds?.length) return;
      reorderMutation.mutate(payload);
    },
    [dragEnabled, reorderMutation],
  );

  return (
    <PageContentPanel
      header={<SearchBar placeholder="Search locations..." onDebouncedChange={setSearchQuery} debounceMs={250} />}
      headerClassName="shrink-0"
      isLoading={isLoading}
      isEmpty={treeData.length === 0}
      emptyState={
        <Empty
          icon={<FolderTree />}
          title={searchQuery ? 'No results' : 'No locations'}
          description={searchQuery ? 'Try a different search term' : 'Add a location to get started'}
        />
      }
    >
      <TreeView
        data={treeData}
        isLoading={isLoading}
        selectedItemId={selectedId}
        onSelectChange={(item) => onSelect(item?.id ?? null)}
        onReorder={handleReorder}
        defaultDraggable={dragEnabled}
        defaultDroppable={dragEnabled}
        renderItem={(params) => <LocationRow {...params} />}
        defaultNodeIcon={MapPinCheck}
        defaultLeafIcon={MapPin}
      />
    </PageContentPanel>
  );
};
