import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CatalogChannelData, type EditAppChannelFormData, editAppChannelSchema } from '@/schemas/catalog-channels';
import { CatalogSelector } from '@/selectors/catalog';
import type { UseUpdateAppChannel } from '../types';

interface EditAppChannelDialogProps {
  channel: CatalogChannelData;
  useUpdate: UseUpdateAppChannel;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditAppChannelDialog: React.FC<EditAppChannelDialogProps> = ({
  channel,
  useUpdate,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<EditAppChannelFormData>({
    resolver: zodResolver(editAppChannelSchema),
    defaultValues: { catalogId: channel.catalogId },
  });

  const updateMutation = useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      transformSubmit={({ catalogId }) => ({ channelId: channel.id, catalogId })}
      onCancel={onCancel}
    >
      <CatalogSelector name="catalogId" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
