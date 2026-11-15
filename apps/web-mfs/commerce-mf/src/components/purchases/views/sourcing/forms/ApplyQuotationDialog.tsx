import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type ApplyPurchaseQuotationFormData,
  applyPurchaseQuotationSchema,
  type PurchaseHeader,
  type PurchaseItem,
  type PurchaseQuotation,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../../bindings';

interface ApplyQuotationDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  items: PurchaseItem[];
  quotations: PurchaseQuotation[];
  onSuccess: () => void;
  onCancel: () => void;
}

// Allocates every item a posted quotation prices to its supplier, at the quoted unit and price
export const ApplyQuotationDialog: React.FC<ApplyQuotationDialogProps> = ({
  binding,
  purchase,
  items,
  quotations,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ApplyPurchaseQuotationFormData>({ resolver: zodResolver(applyPurchaseQuotationSchema) });
  const allocateMutation = binding.useAddAllocationsFromQuotation({ onSuccess });
  const postedQuotations = quotations.filter((quotation) => quotation.isPosted);
  const purchaseItemIds = new Set(items.map((item) => item.inventoryItemId));

  return (
    <Form
      form={form}
      mutation={allocateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        supplierQuotationItemIds: (postedQuotations.find((quotation) => quotation.id === data.quotationId)?.items ?? [])
          .filter((line) => purchaseItemIds.has(line.inventoryItemId))
          .map((line) => line.id),
      })}
    >
      <Select
        name="quotationId"
        label="Quotation"
        placeholder="Select a posted quotation"
        options={postedQuotations.map((quotation) => ({
          value: quotation.id,
          label: `${quotation.quotationNumber} — ${quotation.supplierName}`,
          description: `${quotation.pricedItemCount} of ${pluralize('line', quotation.itemCount, true)} priced`,
        }))}
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Allocating...">
          Use Quotation
        </Button>
      </DialogActions>
    </Form>
  );
};
