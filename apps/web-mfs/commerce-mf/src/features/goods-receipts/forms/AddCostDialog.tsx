import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { CostCategorySelector } from '@vritti/quantum-ui/selects/cost-category';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAssociateGoodsReceiptCost, useUpdateGoodsReceiptCost } from '@/hooks/goods-receipts';
import {
  type AssociateCostFormData,
  associateCostSchema,
  type CostRowData,
  DISTRIBUTION_OPTIONS,
} from '@/schemas/inventory-item-costs';

interface AddCostDialogProps {
  goodsReceiptId: string;
  // When provided, the dialog is in EDIT mode: prefills, hides category, submits via update.
  editing?: CostRowData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCostDialog: React.FC<AddCostDialogProps> = ({ goodsReceiptId, editing, onSuccess, onCancel }) => {
  const buCurrencyCode = useBUCurrency() ?? 'INR';
  if (editing) {
    return (
      <EditCostForm
        goodsReceiptId={goodsReceiptId}
        editing={editing}
        buCurrencyCode={buCurrencyCode}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
  }
  return <AddCostForm goodsReceiptId={goodsReceiptId} buCurrencyCode={buCurrencyCode} onSuccess={onSuccess} onCancel={onCancel} />;
};

interface InnerProps {
  goodsReceiptId: string;
  buCurrencyCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddCostForm: React.FC<InnerProps> = ({ goodsReceiptId, buCurrencyCode, onSuccess, onCancel }) => {
  const form = useForm<AssociateCostFormData>({
    resolver: zodResolver(associateCostSchema),
    defaultValues: {
      categoryId: '',
      totalAmount: { currency: buCurrencyCode, value: '' },
      distributionMethod: 'by_value',
      vendorRef: '',
      notes: '',
    },
  });
  const mutation = useAssociateGoodsReceiptCost(goodsReceiptId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        categoryId: data.categoryId,
        totalAmount: data.totalAmount!,
        distributionMethod: data.distributionMethod,
        vendorRef: data.vendorRef || undefined,
        notes: data.notes || undefined,
      })}
    >
      <div className="space-y-4">
        <CostCategorySelector name="categoryId" label="Cost Category" placeholder="Select category" />
        <CurrencyField name="totalAmount" label="Total Amount" currencyCode={buCurrencyCode} />
        <RadioGroup
          name="distributionMethod"
          label="Distribution"
          options={DISTRIBUTION_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }))}
        />
        <TextField name="vendorRef" label="Vendor / Invoice Reference" placeholder="e.g. INV-FR-99 (optional)" />
        <TextArea name="notes" label="Notes" placeholder="Optional notes" rows={2} />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Cost
        </Button>
      </div>
    </Form>
  );
};

interface EditInnerProps extends InnerProps {
  editing: CostRowData;
}

const EditCostForm: React.FC<EditInnerProps> = ({ goodsReceiptId, editing, buCurrencyCode, onSuccess, onCancel }) => {
  const form = useForm<AssociateCostFormData>({
    resolver: zodResolver(associateCostSchema),
    defaultValues: {
      categoryId: editing.categoryId,
      totalAmount: editing.totalAmount,
      distributionMethod: editing.distributionMethod,
      vendorRef: editing.vendorRef ?? '',
      notes: editing.notes ?? '',
    },
  });
  const mutation = useUpdateGoodsReceiptCost(goodsReceiptId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        costId: editing.id,
        data: {
          totalAmount: data.totalAmount,
          distributionMethod: data.distributionMethod,
          vendorRef: data.vendorRef || null,
          notes: data.notes || null,
        },
      })}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium">
            {editing.categoryName} <span className="text-muted-foreground">· {editing.categoryKind}</span>
          </span>
        </div>
        <CurrencyField name="totalAmount" label="Total Amount" currencyCode={buCurrencyCode} />
        <RadioGroup
          name="distributionMethod"
          label="Distribution"
          options={DISTRIBUTION_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }))}
        />
        <TextField name="vendorRef" label="Vendor / Invoice Reference" placeholder="e.g. INV-FR-99 (optional)" />
        <TextArea name="notes" label="Notes" placeholder="Optional notes" rows={2} />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
