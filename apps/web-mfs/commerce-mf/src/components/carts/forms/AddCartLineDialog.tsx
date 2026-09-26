import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { type AddCartLineFormData, addCartLineSchema } from '@/schemas/carts';
import type { CartsBinding } from '../types';

interface AddCartLineDialogProps {
  binding: CartsBinding;
  cartId: string;
  partyId: string;
  channelId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Adds a product to a basket.
 *
 * The product list is a server-driven selector over `select-api/channel-items`, scoped to the
 * channel this workspace sells through — so only what the workspace actually lists can be chosen, and the
 * refusal never has to come from the server.
 */
export const AddCartLineDialog = ({
  binding,
  cartId,
  partyId,
  channelId,
  onSuccess,
  onCancel,
}: AddCartLineDialogProps) => {
  const form = useForm<AddCartLineFormData>({
    resolver: zodResolver(addCartLineSchema),
    defaultValues: { offeringVariantId: '', quantity: 1 },
  });

  const createMutation = binding.useAddCartLine(cartId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(values) => ({ ...values, partyId })}
    >
      <FormSection title="Product" contentClassName="grid grid-cols-1 gap-4">
        <Select
          name="offeringVariantId"
          label="Product"
          placeholder={channelId ? 'Search products' : `This ${binding.scopeNoun} has no channel yet`}
          searchable
          disabled={!channelId}
          /**
           * The endpoint is withheld until there is a channel to scope it by.
           *
           * `disabled` does not stop the Select resolving its options, so leaving the endpoint
           * mounted fires `channel-items?channelId=`, which the DTO rightly refuses as not a UUID.
           * A static empty list means no request is made at all, rather than one that cannot succeed.
           */
          {...(channelId
            ? {
                optionsEndpoint: 'commerce-api/select-api/channel-items',
                params: { channelId },
                fieldKeys: { valueKey: 'id', labelKey: 'name', descriptionKey: 'sku' },
              }
            : { options: [] })}
        />
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
