import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { CatalogData } from '@/schemas/catalogs';
import { useCloneCatalog } from '@/hooks/site/catalogs';

interface CloneCatalogDialogProps {
  catalog: CatalogData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CloneCatalogDialog: React.FC<CloneCatalogDialogProps> = ({ catalog, onSuccess, onCancel }) => {
  const cloneMutation = useCloneCatalog({ onSuccess });

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="body2" intent="muted">
        Clone this catalog's offerings, variants, options, and modifier groups into a new catalog. You can assign
        channels and edit it afterward.
      </Typography>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          loadingText="Cloning..."
          isLoading={cloneMutation.isPending}
          onClick={() => cloneMutation.mutate({ id: catalog.id })}
        >
          Clone Catalog
        </Button>
      </DialogActions>
    </div>
  );
};
