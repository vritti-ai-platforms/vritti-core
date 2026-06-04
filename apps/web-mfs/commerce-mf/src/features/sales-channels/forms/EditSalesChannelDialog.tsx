import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSalesChannel } from '@/hooks/sales-channels';
import {
  type SalesChannelData,
  type UpdateSalesChannelFormData,
  updateSalesChannelSchema,
} from '@/schemas/sales-channels';

interface EditSalesChannelDialogProps {
  channel: SalesChannelData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSalesChannelDialog: React.FC<EditSalesChannelDialogProps> = ({ channel, onSuccess, onCancel }) => {
  const form = useForm<UpdateSalesChannelFormData>({
    resolver: zodResolver(updateSalesChannelSchema),
    defaultValues: {
      name: channel.name,
      isActive: channel.isActive,
    },
  });

  const updateMutation = useUpdateSalesChannel({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: channel.id, data: { name: data.name, isActive: data.isActive } })}
    >
      <div className="space-y-4">
        <TextField name="code" label="Code" value={channel.code} disabled description="Code cannot be changed" />
        <TextField name="kind" label="Kind" value={channel.kind} disabled description="Kind cannot be changed" />
        <TextField name="name" label="Name" placeholder="e.g. In-Store Counter" />
        <Switch name="isActive" label="Active" description="Inactive channels are hidden from catalog and order forms" />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
