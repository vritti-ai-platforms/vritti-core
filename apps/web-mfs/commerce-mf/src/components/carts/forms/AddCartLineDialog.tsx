import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm, useWatch } from 'react-hook-form';
import { type AddCartLineFormShape, addCartLineFormSchema } from '@/schemas/carts';
import { OfferingSelector } from '@/selectors/offering';
import { OfferingVariantSelector } from '@/selectors/offering-variant';
import type { CartsBinding } from '../types';

interface AddCartLineDialogProps {
  binding: CartsBinding;
  cartId: string;
  partyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds a product to a basket: the offering first, then which of its variants
export const AddCartLineDialog = ({ binding, cartId, partyId, onSuccess, onCancel }: AddCartLineDialogProps) => {
  const form = useForm<AddCartLineFormShape>({
    resolver: zodResolver(addCartLineFormSchema),
    defaultValues: { offeringId: '', offeringVariantId: '', quantity: 1 },
  });

  // Variants only exist inside an offering, so picking one unlocks the next
  const offeringId = useWatch({ control: form.control, name: 'offeringId' });

  const createMutation = binding.useAddCartLine(cartId, { onSuccess });

  // A variant from the previous offering would query the wrong parent
  const handleOfferingChange = () => form.setValue('offeringVariantId', '');

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={({ offeringVariantId, quantity }) => ({ partyId, offeringVariantId, quantity })}
    >
      <FormSection title="Product" contentClassName="grid grid-cols-1 gap-4">
        <OfferingSelector name="offeringId" onOptionSelect={handleOfferingChange} />
        {/* The endpoint requires a real offeringId, so the variant selector only mounts once one is picked */}
        {offeringId ? (
          <OfferingVariantSelector key={offeringId} name="offeringVariantId" offeringId={offeringId} />
        ) : null}
        <TextField name="quantity" label="Quantity" type="number" placeholder="1" />
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add to basket
        </Button>
      </DialogActions>
    </Form>
  );
};
