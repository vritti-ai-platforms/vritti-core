import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { LOCATIONS_KEY, useLocationCount } from '@/hooks/storage-locations';
import { LocationDetailPanel, LocationTreePanel } from './components';
import { AddLocationDialog } from './forms/AddLocationDialog';

export const StorageLocationsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: locationCount } = useLocationCount();
  const formDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Storage Locations"
        description={`${locationCount.count} total locations`}
        actions={
          <Button onClick={formDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Location
          </Button>
        }
      />

      <PageContent>
        <LocationTreePanel selectedId={selectedId} onSelect={setSelectedId} />

        <PageContentDetails className="flex flex-col">
          {selectedId ? (
            <LocationDetailPanel selectedId={selectedId} onSelectLocation={setSelectedId} />
          ) : (
            <Empty
              icon={<MapPin />}
              title="Select a location"
              description="Pick a location from the tree to view details and child locations."
              className="h-full"
            />
          )}
        </PageContentDetails>
      </PageContent>

      <Dialog
        handle={formDialog}
        title="Add Location"
        description="Enter the details for the new location."
        content={(close) => (
          <AddLocationDialog
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
