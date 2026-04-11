import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { MapPin, Plus } from 'lucide-react';
import { useLocations } from '@/hooks/storage-locations';
import { LocationCard } from './components/LocationCard';
import { AddLocationDialog } from './forms/AddLocationDialog';

export const StorageLocationsPage = () => {
  const { data: locations } = useLocations();
  const addDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Storage Locations"
        description={`${locations.length} location${locations.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Location
          </Button>
        }
      />

      {locations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      ) : (
        <Empty
          icon={<MapPin />}
          title="No storage locations"
          description="Add your first storage location to start managing inventory across different areas."
          action={
            <Button variant="outline" onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Location
            </Button>
          }
        />
      )}

      <Dialog
        handle={addDialog}
        title="Add Location"
        description="Create a new storage location."
        content={(close) => <AddLocationDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
