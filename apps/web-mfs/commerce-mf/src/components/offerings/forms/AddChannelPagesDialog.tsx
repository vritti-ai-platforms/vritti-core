import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type AddStorefrontPagesFormData, addStorefrontPagesSchema } from '@/schemas/offerings';
import { OfferingVariantSelector } from '@/selectors/offering-variant';
import type { UseCreateChannelPages } from '../types';

interface AddChannelPagesDialogProps {
  offeringId: string;
  channelType: string;
  targetId: string;
  useCreateChannelPages: UseCreateChannelPages;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adding a page by naming the variant, rather than finding its row.
//
// The table is the usual way in — a row says it has no page and offers to create one. This is for the other
// direction: an editor who knows which variant they want and would otherwise page through the table hunting
// for it. Variants that already have a page come back as skipped, so picking one costs nothing.
export const AddChannelPagesDialog: React.FC<AddChannelPagesDialogProps> = ({
  offeringId,
  channelType,
  targetId,
  useCreateChannelPages,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddStorefrontPagesFormData>({
    resolver: zodResolver(addStorefrontPagesSchema),
    defaultValues: { variantCodes: [] },
  });
  const selected = useWatch({ control: form.control, name: 'variantCodes' });
  const createPages = useCreateChannelPages({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createPages}
      transformSubmit={({ variantCodes }) => ({ offeringId, channelType, targetId, variantCodes })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        {/* Keyed by code, not id: a storefront page is addressed by the variant code */}
        <OfferingVariantSelector
          name="variantCodes"
          multiple
          offeringId={offeringId}
          fieldKeys={{ valueKey: 'code' }}
        />
        <Typography variant="body2" intent="muted">
          {selected.length > 0
            ? `A page is created on this storefront for each of the ${pluralize('variant', selected.length, true)} chosen. Any that already have one are left as they are.`
            : 'Choose the variants this storefront should have a page for.'}
        </Typography>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          {selected.length > 0 ? `Add ${pluralize('page', selected.length, true)}` : 'Add Pages'}
        </Button>
      </DialogActions>
    </Form>
  );
};
