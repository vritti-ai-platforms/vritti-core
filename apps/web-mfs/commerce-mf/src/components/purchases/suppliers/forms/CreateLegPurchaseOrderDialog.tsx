import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { uniq } from '@vritti/quantum-ui/lodash';
import { TextField } from '@vritti/quantum-ui/TextField';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseDetail,
  type PurchaseLeg,
  type PurchaseLegPurchaseOrdersFormData,
  purchaseLegPurchaseOrdersSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface CreateLegPurchaseOrderDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  leg: PurchaseLeg;
  onSuccess: () => void;
  onCancel: () => void;
}

// Raises the leg's purchase orders from its allocations — one per currency, sent to the supplier — on an order date,
// with a rate to the legal entity's currency for each other currency they are priced in
export const CreateLegPurchaseOrderDialog: React.FC<CreateLegPurchaseOrderDialogProps> = ({
  binding,
  purchase,
  leg,
  onSuccess,
  onCancel,
}) => {
  const leCurrencyCode = useWorkspaceCurrency();
  const timeZone = useWorkspaceTimeZone(purchase.siteId);
  const foreignCurrencies = uniq(
    leg.allocations
      .filter((allocation) => allocation.isPriced)
      .map((allocation) => allocation.unitPrice.currency)
      .filter((code) => code !== leCurrencyCode),
  );
  const form = useForm<PurchaseLegPurchaseOrdersFormData>({
    resolver: zodResolver(purchaseLegPurchaseOrdersSchema),
    defaultValues: {
      orderDate: isoTodayDate(timeZone),
      exchangeRates: foreignCurrencies.map((currencyCode) => ({ currencyCode })),
    },
  });
  const purchaseOrderMutation = binding.useCreateLegPurchaseOrders({ onSuccess });

  return (
    <Form
      form={form}
      mutation={purchaseOrderMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        legId: leg.id,
        orderDate: data.orderDate,
        exchangeRates: data.exchangeRates.length > 0 ? data.exchangeRates : undefined,
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
      })}
    >
      <DatePicker name="orderDate" label="Order Date" description="Also the date tax is determined on" />
      {foreignCurrencies.map((currencyCode, index) => (
        <TextField
          key={currencyCode}
          name={`exchangeRates.${index}.rate`}
          label={`1 ${currencyCode} in ${leCurrencyCode}`}
          type="number"
          positive
          nonZero
          placeholder="e.g. 83.25"
        />
      ))}
      <DatePicker
        name="expectedDeliveryDate"
        label="Expected Delivery (optional)"
        description="Otherwise the order date plus each item's lead time at the site"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase Order
        </Button>
      </DialogActions>
    </Form>
  );
};
