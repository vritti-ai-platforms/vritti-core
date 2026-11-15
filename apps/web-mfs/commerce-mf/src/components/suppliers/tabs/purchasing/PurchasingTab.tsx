import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import Decimal from '@vritti/quantum-ui/decimal';
import { useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { Pencil, ShoppingCart } from 'lucide-react';
import type React from 'react';
import { PurchaseStepChips } from '@/components/purchases/PurchaseStepChips';
import { upcomingFlow } from '@/components/purchases/purchaseState';
import { purchaseTypeConfig } from '@/schemas/purchases';
import type { SupplierEnrollmentKey } from '@/schemas/supplier-enrollments';
import type { SupplierEnrollmentPurchasingBinding } from '../../bindings';
import { EditPurchasingDialog } from './EditPurchasingDialog';

interface PurchasingTabProps {
  binding: SupplierEnrollmentPurchasingBinding;
  enrollmentKey: SupplierEnrollmentKey;
  editPermission: string;
  supplierName: string;
  siteLabel: string;
}

// How every purchase leg with the supplier at the site runs — copied onto a leg when it is submitted, so later edits
// never change a leg in flight
export const PurchasingTab: React.FC<PurchasingTabProps> = ({
  binding,
  enrollmentKey,
  editPermission,
  supplierName,
  siteLabel,
}) => {
  const fmt = useFormatters();
  const editDialog = useDialog();
  const { data: purchasing } = binding.usePurchasing(enrollmentKey);
  if (!purchasing) return null;
  const type = purchaseTypeConfig[purchasing.purchaseType];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>{`Purchasing at ${siteLabel}`}</CardTitle>
          <CardDescription>
            {`Every purchase from ${supplierName} here follows these settings. A purchase copies them when its supplier is submitted.`}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          permission={editPermission}
          startAdornment={<Pencil className="size-4" />}
          onClick={editDialog.open}
        >
          Edit Purchasing
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <DetailField
            label="Purchase Type"
            type="string"
            className="sm:col-span-3"
            value={
              <span className="flex flex-col gap-2">
                <span>{`${type.label} — ${type.description}`}</span>
                <PurchaseStepChips steps={upcomingFlow(type.steps)} />
              </span>
            }
          />
          <DetailField
            label="Approvers"
            type="string"
            value={purchasing.approvalEnabled ? purchasing.approverNames.join(', ') : 'No approval'}
          />
          {new Decimal(purchasing.approvalThreshold.value).isZero() ? (
            <DetailField label="Approval Above" type="string" value="Every purchase" />
          ) : (
            <DetailField label="Approval Above" type="currency" value={purchasing.approvalThreshold} />
          )}
          <DetailField
            label="Quality Check"
            type="string"
            value={purchasing.qualityCheckEnabled ? `Quarantine at ${purchasing.quarantineLocationName}` : 'Off'}
          />
          <DetailField label="Default Receipt Location" type="string" value={purchasing.defaultReceiptLocationName} />
          <DetailField
            label="Price Tolerance"
            type="string"
            value={`${fmt.number(purchasing.priceTolerancePct).primary}%`}
          />
          <DetailField
            label="Quantity Tolerance"
            type="string"
            value={`${fmt.number(purchasing.qtyTolerancePct).primary}%`}
          />
          <DetailField label="Amount Tolerance" type="currency" value={purchasing.amountTolerance} />
        </div>
      </CardContent>
      <Dialog
        handle={editDialog}
        icon={ShoppingCart}
        className="max-w-3xl"
        title="Edit Purchasing"
        description={`How purchases from ${supplierName} at ${siteLabel} run.`}
        content={(close) => (
          <EditPurchasingDialog
            binding={binding}
            enrollmentKey={enrollmentKey}
            purchasing={purchasing}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </Card>
  );
};
