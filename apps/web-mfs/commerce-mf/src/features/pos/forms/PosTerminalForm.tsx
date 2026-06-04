import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePosTerminal, useUpdatePosTerminal } from '@/hooks/pos-terminals';
import { type PosTerminalData, type PosTerminalFormData, posTerminalFormSchema } from '@/schemas/pos-terminals';

interface PosTerminalFormProps {
  terminal?: PosTerminalData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PosTerminalForm: React.FC<PosTerminalFormProps> = ({ terminal, onSuccess, onCancel }) => {
  const isEdit = !!terminal;

  const form = useForm<PosTerminalFormData>({
    resolver: zodResolver(posTerminalFormSchema),
    defaultValues: terminal
      ? {
          name: terminal.name,
          code: terminal.code,
          locationId: terminal.locationId,
          catalogId: terminal.catalogId ?? '',
          description: terminal.description ?? '',
          isActive: terminal.isActive,
        }
      : {
          name: '',
          code: '',
          locationId: '',
          catalogId: '',
          description: '',
          isActive: true,
        },
  });

  const createMutation = useCreatePosTerminal({ onSuccess });
  const updateMutation = useUpdatePosTerminal({ onSuccess });

  const handleSubmit = (data: PosTerminalFormData) => {
    if (isEdit) {
      updateMutation.mutate({
        id: terminal?.id,
        data: {
          name: data.name,
          locationId: data.locationId,
          catalogId: data.catalogId,
          description: data.description?.trim() ? data.description.trim() : null,
          isActive: data.isActive,
        },
      });
      return;
    }
    createMutation.mutate({
      name: data.name,
      code: data.code,
      locationId: data.locationId,
      catalogId: data.catalogId,
      description: data.description?.trim() ? data.description.trim() : undefined,
    });
  };

  return (
    <Form form={form} onSubmit={handleSubmit} onCancel={onCancel} resetOnSuccess={!isEdit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField name="name" label="Terminal Name" placeholder="e.g. Counter 1" />
          <TextField name="code" label="Terminal Code" placeholder="e.g. POS-CTR-1" disabled={isEdit} />
        </div>

        <Select
          name="locationId"
          label="POS Location"
          placeholder="Select location"
          searchable
          optionsEndpoint="commerce-api/pos-terminals/locations/select"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          description="Only storage locations with role POS are listed."
        />

        <Select
          name="catalogId"
          label="Catalog"
          placeholder="Select catalog"
          searchable
          optionsEndpoint="commerce-api/catalogs/select"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          description="The catalog this terminal sells from — drives the offerings and pricing shown at the register."
        />

        <TextArea name="description" label="Description" placeholder="Optional notes about this terminal" rows={3} />
        {isEdit && <Switch name="isActive" label="Active" description="Inactive terminals can't take orders" />}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? 'Save Changes' : 'Add Terminal'}</Button>
      </div>
    </Form>
  );
};
