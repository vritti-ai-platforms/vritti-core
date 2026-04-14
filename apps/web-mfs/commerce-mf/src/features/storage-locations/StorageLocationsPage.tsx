import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LOCATIONS_KEY, useLocationById, useLocationCount } from '@/hooks/storage-locations';
import { LocationDetailPanel, LocationEmptyState, LocationTreePanel } from './components';
import { AddLocationDialog } from './forms/AddLocationDialog';

export const StorageLocationsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: locationCount } = useLocationCount();
  const { data: selectedLocation, isLoading: isSelectedLocationLoading } = useLocationById(selectedId);
  const formDialog = useDialog();

  function openAdd() {
    formDialog.open();
  }

  function invalidateLocations() {
    queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Storage Locations"
        description={`${locationCount.count} total locations`}
        actions={
          <Button onClick={openAdd} startAdornment={<Plus className="size-4" />}>
            Add Location
          </Button>
        }
      />

      <PageContent>
        <LocationTreePanel selectedId={selectedId} onSelect={setSelectedId} />

        <div className="flex-1 overflow-auto p-6 min-w-0 flex flex-col">
          {selectedLocation ? (
            <LocationDetailPanel location={selectedLocation} onSelectLocation={setSelectedId} />
          ) : selectedId && isSelectedLocationLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading…</div>
          ) : (
            <LocationEmptyState />
          )}
        </div>
      </PageContent>

      <Dialog
        handle={formDialog}
        title="Add Location"
        description="Enter the details for the new location."
        content={(close) => (
          <AddLocationDialog
            onSuccess={() => {
              invalidateLocations();
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
