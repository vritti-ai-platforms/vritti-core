import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { CreatedPurchase } from '@/schemas/purchases';
import { buildCreatePurchaseSchema, type CreatePurchaseFormData } from '@/schemas/purchases';
import { SiteSelector } from '@/selectors/site';
import type { PurchasesBinding } from '../bindings';

interface CreatePurchaseDialogProps {
  binding: PurchasesBinding;
  // The site picked in the list's context, which the site field starts with
  siteId?: string;
  onSuccess: (purchase: CreatedPurchase) => void;
  onCancel: () => void;
}

// Creates a purchase — its items are added next and suppliers chosen when sourcing
export const CreatePurchaseDialog: React.FC<CreatePurchaseDialogProps> = ({ binding, siteId, onSuccess, onCancel }) => {
  const form = useForm<CreatePurchaseFormData>({
    resolver: zodResolver(buildCreatePurchaseSchema({ requiresSite: binding.spansSites })),
    defaultValues: { ...(siteId && { siteId }), notes: '', quotationsRequired: false, minQuotations: 1 },
  });
  const createMutation = binding.useCreate({ onSuccess: (response) => onSuccess(response.data) });
  const quotationsRequired = useWatch({ control: form.control, name: 'quotationsRequired' });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId: data.siteId,
        notes: data.notes.trim() || undefined,
        quotationsRequired: data.quotationsRequired,
        minQuotations: data.quotationsRequired ? data.minQuotations : undefined,
      })}
    >
      {binding.spansSites && <SiteSelector name="siteId" />}
      <Switch
        name="quotationsRequired"
        label="Request quotations"
        description="Ask suppliers for their prices before choosing who to buy from; orders then use the prices they quote"
      />
      {quotationsRequired && (
        <TextField
          name="minQuotations"
          label="Quotations needed"
          type="number"
          integer
          positive
          nonZero
          description="How many suppliers must send a quotation before you choose suppliers"
        />
      )}
      <TextArea name="notes" label="Notes" placeholder="Anything others working on this purchase should know" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase
        </Button>
      </DialogActions>
    </Form>
  );
};
