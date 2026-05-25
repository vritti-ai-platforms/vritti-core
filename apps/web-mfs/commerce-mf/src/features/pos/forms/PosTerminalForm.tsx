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
import { useSaveTerminalPriceLists } from '@/hooks/price-lists';
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
          description: terminal.description ?? '',
          isActive: terminal.isActive,
        }
      : {
          name: '',
          code: '',
          locationId: '',
          priceListId: '',
          description: '',
          isActive: true,
        },
  });

  const createMutation = useCreatePosTerminal();
  const updateMutation = useUpdatePosTerminal({ onSuccess });
  const savePriceListsMutation = useSaveTerminalPriceLists();

  const handleSubmit = async (data: PosTerminalFormData) => {
    if (isEdit) {
      await updateMutation.mutateAsync({
        id: terminal!.id,
        data: {
          name: data.name,
          locationId: data.locationId,
          description: data.description?.trim() ? data.description.trim() : null,
          isActive: data.isActive,
        },
      });
      return;
    }

    const result = await createMutation.mutateAsync({
      name: data.name,
      code: data.code,
      locationId: data.locationId,
      description: data.description?.trim() ? data.description.trim() : undefined,
    });

    if (data.priceListId) {
      await savePriceListsMutation.mutateAsync({
        terminalId: result.data.id,
        data: { priceLists: [{ priceListId: data.priceListId, priority: 0, isDefault: true }] },
      });
    }

    onSuccess();
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

        {!isEdit && (
          <Select
            name="priceListId"
            label="Price List"
            placeholder="Select price list (optional)"
            searchable
            optionsEndpoint="commerce-api/price-lists/select"
            fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
            description="Assign a default price list to this terminal. You can add more from the terminal detail page."
          />
        )}

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
