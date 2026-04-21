import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxGroup } from '@/hooks/tax-groups';
import { type TaxGroupFormData, taxGroupFormResolver } from '@/schemas/tax-groups';
import { TaxGroupForm } from './TaxGroupForm';

interface AddTaxGroupDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTaxGroupDialog: React.FC<AddTaxGroupDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<TaxGroupFormData>({
    resolver: taxGroupFormResolver,
    defaultValues: {
      name: '',
      isDefault: false,
      isActive: true,
      sortOrder: 0,
      taxRates: [{ name: '', rate: 0, type: 'exclusive' }],
    },
  });

  const createMutation = useCreateTaxGroup({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      className="flex max-h-[70vh] flex-col overflow-hidden"
      transformSubmit={(data) => ({
        name: data.name,
        isDefault: data.isDefault,
        taxRates: data.taxRates.map((rate) => ({
          name: rate.name,
          rate: Number(rate.rate),
          type: rate.type,
        })),
      })}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <TaxGroupForm form={form} compactRates />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Tax Group
        </Button>
      </div>
    </Form>
  );
};
