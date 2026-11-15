import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseHeader,
  type RequestPurchaseQuotationFormData,
  requestPurchaseQuotationSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../../bindings';
import type { PurchaseQuotationLink } from '../../../types';

interface RequestQuotationDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  onSuccess: (quotation: PurchaseQuotationLink) => void;
  onCancel: () => void;
}

// Opens a draft quotation for a supplier with one line per purchase item, for the legal entity to price and post
export const RequestQuotationDialog: React.FC<RequestQuotationDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const { SupplierSelector } = binding;
  const [supplierName, setSupplierName] = useState('');
  const form = useForm<RequestPurchaseQuotationFormData>({ resolver: zodResolver(requestPurchaseQuotationSchema) });
  const requestMutation = binding.useRequestQuotation({
    onSuccess: (response, variables) =>
      onSuccess({ supplierId: variables.supplierId, supplierName, quotationId: response.data.quotationId }),
  });

  return (
    <Form
      form={form}
      mutation={requestMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, supplierId: data.supplierId })}
    >
      <SupplierSelector
        name="supplierId"
        description="A supplier enrolled at the purchase's site"
        params={binding.supplierParams?.(purchase.siteId)}
        onOptionSelect={(option: SelectOption | null) => setSupplierName(option?.label ?? '')}
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Requesting...">
          Request Quotation
        </Button>
      </DialogActions>
    </Form>
  );
};
