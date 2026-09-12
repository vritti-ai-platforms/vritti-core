import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { AppSelector } from '@vritti/quantum-ui/selects/app';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type AddAppChannelFormData, addAppChannelSchema } from '@/schemas/catalog-channels';
import { CatalogSelector } from '@/selectors';
import type { UseCreateAppChannel } from '../types';

interface AddAppChannelDialogProps {
  useCreate: UseCreateAppChannel;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddAppChannelDialog: React.FC<AddAppChannelDialogProps> = ({ useCreate, onSuccess, onCancel }) => {
  const form = useForm<AddAppChannelFormData>({
    resolver: zodResolver(addAppChannelSchema),
    defaultValues: { catalogId: '', appId: null },
  });

  const createMutation = useCreate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      transformSubmit={({ catalogId, appId }) => ({ catalogId, appId: appId || null })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <CatalogSelector name="catalogId" />
        <AppSelector
          name="appId"
          label="App"
          placeholder="Any app"
          description="Leave empty for the catalog every unnamed caller gets. Pick an app to give just that app its own catalog."
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Catalog
        </Button>
      </DialogActions>
    </Form>
  );
};
