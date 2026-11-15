import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import Decimal from '@vritti/quantum-ui/decimal';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { PurchaseStepChips } from '@/components/purchases/PurchaseStepChips';
import { upcomingFlow } from '@/components/purchases/purchaseState';
import { LocationRoleValues } from '@/schemas/locations';
import { PurchaseTypeValues, purchaseTypeConfig } from '@/schemas/purchases';
import {
  type EnrollmentPurchasing,
  type EnrollmentPurchasingFormData,
  enrollmentPurchasingSchema,
  type SupplierEnrollmentKey,
} from '@/schemas/supplier-enrollments';
import { LocationSelector } from '@/selectors/location';
import { UserSelector } from '@/selectors/user';
import type { SupplierEnrollmentPurchasingBinding } from '../../bindings';

interface EditPurchasingDialogProps {
  binding: SupplierEnrollmentPurchasingBinding;
  enrollmentKey: SupplierEnrollmentKey;
  purchasing: EnrollmentPurchasing;
  onSuccess: () => void;
  onCancel: () => void;
}

const PURCHASE_TYPE_OPTIONS = Object.values(PurchaseTypeValues).map((type) => ({
  value: type,
  label: purchaseTypeConfig[type].label,
  description: (
    <span className="flex flex-col gap-2 pt-1">
      <PurchaseStepChips steps={upcomingFlow(purchaseTypeConfig[type].steps)} />
      <span>{purchaseTypeConfig[type].description}</span>
    </span>
  ),
}));

const STORAGE_ROLES = `${LocationRoleValues.STORAGE},${LocationRoleValues.RESERVED_STORAGE}`;

// Sets how the supplier's purchase legs at the site run — the purchase type, who approves them and above what, whether
// receipts wait in quarantine, where goods land, and the invoice tolerances; a leg copies them when it is submitted
export const EditPurchasingDialog: React.FC<EditPurchasingDialogProps> = ({
  binding,
  enrollmentKey,
  purchasing,
  onSuccess,
  onCancel,
}) => {
  const leCurrencyCode = useWorkspaceCurrency();
  const form = useForm<EnrollmentPurchasingFormData>({
    resolver: zodResolver(enrollmentPurchasingSchema),
    defaultValues: {
      purchaseType: purchasing.purchaseType,
      approvalEnabled: purchasing.approvalEnabled,
      approverUserIds: purchasing.approverUserIds,
      approvalThreshold: new Decimal(purchasing.approvalThreshold.value).isZero()
        ? undefined
        : purchasing.approvalThreshold,
      qualityCheckEnabled: purchasing.qualityCheckEnabled,
      quarantineLocationId: purchasing.quarantineLocationId ?? undefined,
      defaultReceiptLocationId: purchasing.defaultReceiptLocationId ?? undefined,
      priceTolerancePct: purchasing.priceTolerancePct,
      qtyTolerancePct: purchasing.qtyTolerancePct,
      amountTolerance: purchasing.amountTolerance,
    },
  });
  const updateMutation = binding.useUpdatePurchasing({ onSuccess });
  const [approvalEnabled, qualityCheckEnabled] = useWatch({
    control: form.control,
    name: ['approvalEnabled', 'qualityCheckEnabled'],
  });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...enrollmentKey,
        data: {
          purchaseType: data.purchaseType,
          approvalEnabled: data.approvalEnabled,
          approverUserIds: data.approvalEnabled ? data.approverUserIds : [],
          approvalThreshold:
            data.approvalEnabled && data.approvalThreshold?.value
              ? data.approvalThreshold
              : { currency: leCurrencyCode, value: '0' },
          qualityCheckEnabled: data.qualityCheckEnabled,
          quarantineLocationId: data.qualityCheckEnabled ? (data.quarantineLocationId ?? null) : null,
          defaultReceiptLocationId: data.defaultReceiptLocationId ?? null,
          priceTolerancePct: data.priceTolerancePct,
          qtyTolerancePct: data.qtyTolerancePct,
          amountTolerance: data.amountTolerance,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection
          title="Purchase Type"
          description="How goods and the supplier invoice arrive from this supplier"
          contentClassName="block"
        >
          <RadioGroup name="purchaseType" variant="card" orientation="horizontal" options={PURCHASE_TYPE_OPTIONS} />
        </FormSection>

        <FormSection title="Approval" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Switch
              name="approvalEnabled"
              label="Approval"
              description="A purchase from this supplier waits for approval before anything is ordered or received"
            />
          </div>
          {approvalEnabled && (
            <>
              <UserSelector
                name="approverUserIds"
                label="Approvers"
                multiple
                description="Any one of them can approve"
              />
              <CurrencyField
                name="approvalThreshold"
                label="Only Above (optional)"
                currencyCode={leCurrencyCode}
                description="Leave empty to approve every purchase"
              />
            </>
          )}
        </FormSection>

        <FormSection title="Receipt" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Switch
              name="qualityCheckEnabled"
              label="Quality check"
              description="Receipts land in quarantine until released"
            />
          </div>
          {qualityCheckEnabled && (
            <LocationSelector
              name="quarantineLocationId"
              label="Quarantine Location"
              params={{ locationRoles: STORAGE_ROLES, atSiteId: enrollmentKey.siteId }}
            />
          )}
          <LocationSelector
            name="defaultReceiptLocationId"
            label="Default Receipt Location"
            params={{ locationRoles: STORAGE_ROLES, atSiteId: enrollmentKey.siteId }}
            clearable
          />
        </FormSection>

        <FormSection
          title="Invoice Tolerances"
          description="Differences within these limits don't put an invoice on hold"
          contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <TextField name="priceTolerancePct" label="Price (%)" type="number" min={0} />
          <TextField name="qtyTolerancePct" label="Quantity (%)" type="number" min={0} />
          <CurrencyField name="amountTolerance" label="Amount" currencyCode={leCurrencyCode} />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Purchasing
        </Button>
      </DialogActions>
    </Form>
  );
};
