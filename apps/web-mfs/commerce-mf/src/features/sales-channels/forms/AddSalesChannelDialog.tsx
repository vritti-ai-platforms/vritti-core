import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSalesChannel } from '@/hooks/sales-channels';
import {
  type CreateSalesChannelFormData,
  createSalesChannelSchema,
  SALES_CHANNEL_KIND_OPTIONS,
} from '@/schemas/sales-channels';

interface AddSalesChannelDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSalesChannelDialog: React.FC<AddSalesChannelDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateSalesChannelFormData>({
    resolver: zodResolver(createSalesChannelSchema),
    defaultValues: {
      code: '',
      name: '',
      kind: 'IN_STORE',
    },
  });

  const createMutation = useCreateSalesChannel({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField
          name="code"
          label="Code"
          placeholder="e.g. IN_STORE"
          description="Uppercase letters, digits, and underscores"
        />
        <TextField name="name" label="Name" placeholder="e.g. In-Store Counter" />
        <Select
          name="kind"
          label="Kind"
          placeholder="Select kind"
          options={SALES_CHANNEL_KIND_OPTIONS}
          description="Integration identity — fixed list across all orgs"
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Channel
        </Button>
      </div>
    </Form>
  );
};
