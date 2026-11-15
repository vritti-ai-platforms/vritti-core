import { Badge } from '@vritti/quantum-ui/Badge';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type React from 'react';
import type { LocationStorageTypeFields } from '@/schemas/locations';

interface LocationStorageTypeProps {
  location: LocationStorageTypeFields;
}

// Storage type name with where it comes from: inherited from a zone, or overridden on the location
export const LocationStorageType: React.FC<LocationStorageTypeProps> = ({ location }) => {
  if (!location.storageTypeName) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {location.storageTypeName}
      {location.isStorageTypeOverridden ? (
        <Badge variant="outline">Overridden</Badge>
      ) : (
        location.inheritedFromLocationName && (
          <Tooltip content={`Inherited from ${location.inheritedFromLocationName}`}>
            <Badge variant="secondary">Inherited</Badge>
          </Tooltip>
        )
      )}
    </span>
  );
};
