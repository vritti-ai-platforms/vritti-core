// Unified create/edit form for price lists

import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePriceList, useUpdatePriceList } from '@/hooks/price-lists';
import { type PriceListData, type PriceListFormData, priceListFormSchema } from '@/schemas/price-lists';

interface PriceListFormProps {
  priceList?: PriceListData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PriceListForm: React.FC<PriceListFormProps> = ({ priceList, onSuccess, onCancel }) => {
  const isEdit = !!priceList;

  const form = useForm<PriceListFormData>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: priceList
      ? {
          name: priceList.name,
          code: priceList.code,
          description: priceList.description ?? '',
          isActive: priceList.isActive,
        }
      : {
          name: '',
          code: '',
          description: '',
          isActive: true,
        },
  });

  const createMutation = useCreatePriceList({ onSuccess });
  const updateMutation = useUpdatePriceList({ onSuccess });

  const handleSubmit = async (data: PriceListFormData) => {
    if (isEdit) {
      await updateMutation.mutateAsync({
        id: priceList!.id,
        data: {
          name: data.name,
          code: data.code,
          description: data.description?.trim() ? data.description.trim() : null,
          isActive: data.isActive,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        code: data.code,
        description: data.description?.trim() ? data.description.trim() : undefined,
        isActive: data.isActive ?? true,
      });
    }
  };

  return (
    <Form form={form} onSubmit={handleSubmit} onCancel={onCancel} resetOnSuccess={!isEdit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField name="name" label="Price List Name" placeholder="e.g. Main Menu" />
          <TextField
            name="code"
            label="Code"
            placeholder="e.g. PL-MAIN"
            disabled={isEdit}
            description="Unique code for this price list"
          />
        </div>

        <TextArea name="description" label="Description" placeholder="Optional notes about this price list" rows={3} />
        {isEdit && <Switch name="isActive" label="Active" description="Inactive price lists can't be assigned to terminals" />}
      </div>
    </Form>
  );
};
