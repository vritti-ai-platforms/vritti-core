import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LOCATIONS_KEY, useLocations } from '@/hooks/storage-locations';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { LocationDetailPanel, LocationEmptyState, LocationTreePanel } from './components';
import { AddLocationDialog } from './forms/AddLocationDialog';
import { EditLocationDialog } from './forms/EditLocationDialog';
import { filterTree, toTreeItems } from './utils';

export const StorageLocationsPage = () => {
  const queryClient = useQueryClient();
  const { data: locations = [] } = useLocations();
  const formDialog = useDialog();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formLocation, setFormLocation] = useState<StorageLocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const selectedLocation = locations.find((location) => location.id === selectedId) ?? null;
  const activeCount = locations.filter((location) => location.isActive).length;

  const treeData = useMemo(() => {
    const tree = toTreeItems(locations);
    return searchQuery.trim() ? filterTree(tree, searchQuery) : tree;
  }, [locations, searchQuery]);

  function openAdd() {
    setFormLocation(null);
    formDialog.open();
  }

  function openEdit(location: StorageLocationData) {
    setFormLocation(location);
    formDialog.open();
  }

  function invalidateLocations() {
    queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Storage Locations"
        description={`${activeCount} active · ${locations.length} total locations`}
        actions={
          <Button onClick={openAdd} startAdornment={<Plus className="size-4" />}>
            Add Location
          </Button>
        }
      />

      <PageContent>
        <LocationTreePanel
          locations={locations}
          treeData={treeData}
          selectedId={selectedId}
          searchQuery={searchQuery}
          expandAll={expandAll}
          onSelect={setSelectedId}
          onSearchChange={setSearchQuery}
          onExpandAll={() => setExpandAll(true)}
          onCollapseAll={() => setExpandAll(false)}
        />

        <div className="flex-1 overflow-auto p-6 min-w-0 flex flex-col">
          {selectedLocation ? (
            <LocationDetailPanel
              location={selectedLocation}
              allLocations={locations}
              onEdit={() => openEdit(selectedLocation)}
              onSelectLocation={setSelectedId}
            />
          ) : (
            <LocationEmptyState />
          )}
        </div>
      </PageContent>

      <Dialog
        handle={formDialog}
        title={formLocation ? 'Edit Location' : 'Add Location'}
        description={formLocation ? 'Update the details for this location.' : 'Enter the details for the new location.'}
        content={(close) =>
          formLocation ? (
            <EditLocationDialog
              location={formLocation}
              onSuccess={() => {
                invalidateLocations();
                close();
              }}
              onCancel={close}
            />
          ) : (
            <AddLocationDialog
              onSuccess={() => {
                invalidateLocations();
                close();
              }}
              onCancel={close}
            />
          )
        }
      />
    </div>
  );
};
