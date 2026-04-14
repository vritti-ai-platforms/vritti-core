import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { useDeleteLocation } from '@/hooks/storage-locations';
import type { StorageLocationData } from '@/schemas/storage-locations';

interface LocationDetailPanelProps {
  location: StorageLocationData;
  allLocations: StorageLocationData[];
  onEdit: () => void;
  onSelectLocation: (id: string | null) => void;
}

export const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  location,
  allLocations,
  onEdit,
  onSelectLocation,
}) => {
  const confirm = useConfirm();
  const deleteMutation = useDeleteLocation();

  const childLocations = allLocations.filter((entry) => entry.parentId === location.id);
  const parent = allLocations.find((entry) => entry.id === location.parentId);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${location.name}"?`,
      description: 'This storage location will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(location.id, {
        onSuccess: () => onSelectLocation(parent?.id ?? null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Typography variant="h3">{location.name}</Typography>
          <Badge
            variant={location.isActive ? 'secondary' : 'outline'}
            className={location.isActive ? 'bg-success/15 text-success' : ''}
          >
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{location.code}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!location.canDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Sort Order
          </Typography>
          <Typography variant="body2" className="font-medium">
            {location.sortOrder}
          </Typography>
        </div>
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Child Locations
          </Typography>
          <Typography variant="body2" className="font-medium">
            {childLocations.length}
          </Typography>
        </div>
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Parent
          </Typography>
          <Typography variant="body2" className="font-medium">
            {parent?.name ?? '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="overline" intent="muted" className="mb-1">
            Area
          </Typography>
          <Typography variant="body2" className="font-medium">
            {location.area ?? '—'}
          </Typography>
        </div>
        <div className="col-span-2">
          <Typography variant="overline" intent="muted" className="mb-1">
            Address
          </Typography>
          <Typography variant="body2" className="font-medium">
            {location.address ?? '—'}
          </Typography>
        </div>
      </div>

      {childLocations.length > 0 && (
        <div>
          <Typography variant="overline" intent="muted" className="mb-3">
            Child Locations ({childLocations.length})
          </Typography>
          <div className="space-y-1">
            {childLocations.map((child) => (
              <Button
                key={child.id}
                variant="outline"
                onClick={() => onSelectLocation(child.id)}
                className="w-full justify-between px-3 py-2.5 h-auto font-normal"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Typography variant="body2" className="truncate">
                    {child.name}
                  </Typography>
                </div>
                <Badge
                  variant={child.isActive ? 'secondary' : 'outline'}
                  className={`text-xs shrink-0 ${child.isActive ? 'bg-success/15 text-success' : ''}`}
                >
                  {child.isActive ? 'active' : 'inactive'}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
