import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  buildUpdatePurchaseOrderItemSchema,
  type PurchaseOrderDetail,
  type PurchaseOrderItemData,
  type UpdatePurchaseOrderItemFormData,
} from '@/schemas/purchase-orders';
import { computeFreeQty } from '@/utils/freeQty';
import type { PurchaseOrdersBinding } from '../../../bindings';
import { ConversionPreview } from '../../../ConversionPreview';

interface UpdatePurchaseOrderItemDialogProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes a line's quantity, price, scheme, delivery date or tax date; a line quoted in another of the supplier's
// currencies is edited as quoted
export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  binding,
  purchaseOrder,
  item,
  onSuccess,
  onCancel,
}) => {
  const schema = useMemo(
    () => buildUpdatePurchaseOrderItemSchema({ orderDate: purchaseOrder.orderDate, minQty: item.receivedQty }),
    [purchaseOrder.orderDate, item.receivedQty],
  );
  const form = useForm<UpdatePurchaseOrderItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      uomQty: item.uomQty,
      unitPrice: item.sourceUnitPrice ?? item.unitPrice,
      schemeBuyQty: item.schemeBuyQty ?? undefined,
      schemeFreeQty: item.schemeFreeQty ?? undefined,
      hasScheme: item.hasScheme,
      expectedDeliveryDate: item.expectedDeliveryDate,
      followPoTaxDate: !item.isTaxDateOverridden,
      taxDate: item.taxDate,
    },
  });
  const fmt = useFormatters();
  const deliveryNumbers = item.inboundDeliveryNumbers;
  const isOnDeliveries = deliveryNumbers.length > 0;
  const followPoTaxDate = form.watch('followPoTaxDate');
  const mutation = binding.useUpdateItem({ onSuccess });
  const hasScheme = form.watch('hasScheme');
  const unitPrice = form.watch('unitPrice');
  const sourceCurrency = item.sourceUnitPrice?.currency;
  const sourceRate = sourceCurrency ? purchaseOrder.conversionRates[sourceCurrency] : undefined;
  const freeQtyPreview = computeFreeQty(
    form.watch('uomQty'),
    form.watch('schemeBuyQty'),
    form.watch('schemeFreeQty'),
    hasScheme,
  );

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        itemId: item.id,
        uomQty: data.uomQty,
        unitPrice: data.unitPrice as CurrencyValue | undefined,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
        expectedDeliveryDate: isOnDeliveries ? undefined : data.expectedDeliveryDate,
        ...(item.isTaxDateLocked
          ? {}
          : data.followPoTaxDate
            ? { followPoTaxDate: true }
            : { taxDate: data.taxDate ?? undefined }),
      })}
    >
      <FormSection title="Item">
        <DetailField label="Inventory Item" type="string" value={item.inventoryItemName} />
        <DetailField label="Unit" type="string" value={item.orderUomSymbol} mono />
      </FormSection>

      <FormSection title="Quantity & Price">
        <TextField name="uomQty" label="Quantity" type="number" placeholder="e.g. 500" />
        <CurrencyField
          name="unitPrice"
          label={sourceCurrency ? `Unit Price (${sourceCurrency})` : 'Unit Price'}
          currencyCode={sourceCurrency ?? purchaseOrder.currencyCode}
          placeholder="Enter unit price"
        />
        {sourceCurrency && (
          <ConversionPreview
            price={unitPrice}
            poCurrencyCode={purchaseOrder.currencyCode}
            rate={sourceRate ? Number(sourceRate) : undefined}
          />
        )}
      </FormSection>

      <FormSection
        title="Delivery"
        description={
          isOnDeliveries
            ? `Set by ${pluralize('inbound delivery', deliveryNumbers.length)} ${deliveryNumbers.join(', ')}; change it on the delivery.`
            : "Leave it empty for the order date plus the item's lead time at the site."
        }
      >
        <DatePicker
          name="expectedDeliveryDate"
          label="Expected Delivery"
          minDate={parse(purchaseOrder.orderDate, 'yyyy-MM-dd', new Date())}
          disabled={isOnDeliveries}
        />
      </FormSection>

      <FormSection
        title="Tax Date"
        description={
          followPoTaxDate
            ? `Follows the purchase order's tax date (${fmt.date(purchaseOrder.taxDate).primary}) and its later changes.`
            : 'This line sets its own tax date; it may be before the order date.'
        }
      >
        <Switch
          name="followPoTaxDate"
          label="Follow PO tax date"
          description="Off: this line sets its own"
          disabled={item.isTaxDateLocked}
          disabledTip="A published goods receipt or a posted invoice counts this line, so its tax date is locked."
        />
        <DatePicker name="taxDate" label="Tax Date" disabled={followPoTaxDate || item.isTaxDateLocked} />
      </FormSection>

      <FormSection title="Free Goods Scheme" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
        </div>
        {hasScheme && (
          <>
            <TextField name="schemeBuyQty" label="Buy" type="number" integer positive placeholder="e.g. 9" />
            <TextField name="schemeFreeQty" label="Get Free" type="number" integer positive placeholder="e.g. 1" />
            <FreeQtyPreview value={freeQtyPreview} />
          </>
        )}
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Line Item
        </Button>
      </DialogActions>
    </Form>
  );
};
