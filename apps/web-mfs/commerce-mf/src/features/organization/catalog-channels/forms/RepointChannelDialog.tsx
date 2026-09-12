import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useRepointCatalogChannel } from '@/hooks/organization/catalog-channels';
import {
  type CatalogChannelData,
  type RepointCatalogChannelFormData,
  repointCatalogChannelSchema,
} from '@/schemas/catalog-channels';

interface RepointChannelDialogProps {
  channel: CatalogChannelData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RepointChannelDialog: React.FC<RepointChannelDialogProps> = ({ channel, onSuccess, onCancel }) => {
  const form = useForm<RepointCatalogChannelFormData>({
    resolver: zodResolver(repointCatalogChannelSchema),
    defaultValues: { catalogId: channel.catalogId },
  });

  const repointMutation = useRepointCatalogChannel({ onSuccess });

  return (
    <Form
      form={form}
      mutation={repointMutation}
      transformSubmit={({ catalogId }) => ({ id: channel.id, catalogId })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <Select
          name="catalogId"
          label="Sells"
          placeholder="Select catalog"
          searchable
          optionsEndpoint="commerce-api/select-api/catalogs"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          description="Takes effect immediately — the next request on this channel resolves to the new catalog."
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Repoint
        </Button>
      </DialogActions>
    </Form>
  );
};
