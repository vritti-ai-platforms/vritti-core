import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type OfferingData, type UpdateOfferingFormData, updateOfferingSchema } from '@/schemas/offerings';
import { CategorySelector } from '@/selectors/category';
import type { UseUpdateOffering } from '../types';

interface EditOfferingDialogProps {
  useUpdate: UseUpdateOffering;
  offering: OfferingData;
  onSuccess: () => void;
  onCancel: () => void;
}

// `taxClassId` is absent too: it has its own action, because changing it cascades to the variants.
// `fulfilmentType` is absent by design — it drives the rules existing variants were built against.
// `code` is editable until the first variant exists, after which those SKUs carry it and it is frozen.
export const EditOfferingDialog: React.FC<EditOfferingDialogProps> = ({ useUpdate, offering, onSuccess, onCancel }) => {
  const form = useForm<UpdateOfferingFormData>({
    resolver: zodResolver(updateOfferingSchema),
    defaultValues: {
      code: offering.code,
      name: offering.name,
      description: offering.description ?? '',
      categoryId: offering.categoryId,
    },
  });

  // Editable only until the first variant: after that the SKUs carry it, and stored SKUs never move
  const locked = offering.variantCount > 0;
  const updateMutation = useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: offering.id, data })}
    >
      <div className="flex flex-col gap-4">
        <TextField
          name="code"
          label="Code"
          disabled={locked}
          description={
            locked
              ? `Locked — ${pluralize('variant', offering.variantCount, true)} already carry SKUs built from this code.`
              : 'Becomes the first segment of every variant SKU.'
          }
        />
        <TextField name="name" label="Name" />
        <TextField name="description" label="Description" placeholder="Optional" />
        <CategorySelector name="categoryId" clearable />
      </div>
      <DialogActions>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
