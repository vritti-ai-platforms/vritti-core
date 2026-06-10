import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxGroup } from '@/hooks/tax-groups';
import type { TaxGroupData, TaxGroupFormData } from '@/schemas/tax-groups';
import { taxGroupFormResolver } from '@/schemas/tax-groups';
import { TaxGroupForm } from './TaxGroupForm';

interface EditTaxGroupDialogProps {
  group: TaxGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxGroupDialog: React.FC<EditTaxGroupDialogProps> = ({ group, onSuccess, onCancel }) => {
  const form = useForm<TaxGroupFormData>({
    resolver: taxGroupFormResolver,
    defaultValues: {
      name: group.name,
      isDefault: group.isDefault,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      taxRates: group.taxRates.map((rate) => ({
        name: rate.name,
        rate: rate.rate,
      })),
    },
  });

  const updateMutation = useUpdateTaxGroup({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      className="flex max-h-[70vh] flex-col overflow-hidden"
      transformSubmit={(data) => ({
        id: group.id,
        data: {
          name: data.name,
          isDefault: data.isDefault,
          isActive: data.isActive,
          sortOrder: Number(data.sortOrder),
          taxRates: data.taxRates.map((rate) => ({
            name: rate.name,
            rate: Number(rate.rate),
          })),
        },
      })}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <TaxGroupForm form={form} compactRates showStatusFields />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
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
