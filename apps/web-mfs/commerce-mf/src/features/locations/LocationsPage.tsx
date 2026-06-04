import { LOCATIONS_KEY, useLocationCount } from '@/hooks/locations';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LocationDetailPanel, LocationTreePanel } from './components';
import { AddLocationDialog } from './forms/AddLocationDialog';

export const LocationsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: locationCount } = useLocationCount();
  const formDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Locations"
        description={`${locationCount.count} total locations`}
        actions={
          <Button onClick={formDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Location
          </Button>
        }
      />

      <PageContent>
        <LocationTreePanel selectedId={selectedId} onSelect={setSelectedId} />
        <LocationDetailPanel selectedId={selectedId} onSelectLocation={setSelectedId} />
      </PageContent>

      <Dialog
        handle={formDialog}
        title="Add Location"
        description="Enter the details for the new location."
        className='max-w-3xl'
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
