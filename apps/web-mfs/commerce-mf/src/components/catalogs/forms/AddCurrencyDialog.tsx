import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type AddCatalogCurrencyFormData, addCatalogCurrencySchema } from '@/schemas/catalogs';
import { CurrencySelector } from '@/selectors/currency';
import type { CatalogsBinding } from '../bindings';

interface AddCurrencyDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  existingCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCurrencyDialog: React.FC<AddCurrencyDialogProps> = ({
  binding,
  catalogId,
  existingCodes,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddCatalogCurrencyFormData>({
    resolver: zodResolver(addCatalogCurrencySchema),
  });

  const addMutation = binding.useAddCurrency({ onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      transformSubmit={({ currencyCode }) => ({ catalogId, currencyCode })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <CurrencySelector
          name="currencyCode"
          excludeCodes={existingCodes}
          description="Listings keep their own prices per currency — adding one prices nothing by itself."
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Currency
        </Button>
      </DialogActions>
    </Form>
  );
};
