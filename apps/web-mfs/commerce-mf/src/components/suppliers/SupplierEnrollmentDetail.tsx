import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Plus, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierEnrollmentBinding } from './bindings';
import { EditEnrollmentDialog } from './forms/EditEnrollmentDialog';
import { EnrollDialog } from './forms/EnrollDialog';
import { OverviewTab } from './tabs/OverviewTab';
import { QuotationsTab } from './tabs/quotations/QuotationsTab';
import { SiteItemsTab } from './tabs/site-items/SiteItemsTab';

interface SupplierEnrollmentDetailProps {
  binding: SupplierEnrollmentBinding;
}

// A supplier as one site sees it — enrolled or not: enrollment, the items the site buys, and removal from the site
export const SupplierEnrollmentDetail: React.FC<SupplierEnrollmentDetailProps> = ({ binding }) => {
  const supplierRef = binding.useEnrollmentRef();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: supplier } = binding.useEnrollment(supplierRef);
  const navigate = useNavigate();
  const exitPath = binding.useExitPath();
  const confirm = useConfirm();
  const editDialog = useDialog();
  const enrollDialog = useDialog();
  const deleteMutation = binding.useDeleteEnrollment({ onSuccess: () => navigate(exitPath) });
  const setActiveMutation = binding.useSetEnrollmentActive();

  const siteLabel = supplier.siteName ?? 'this site';
  const enrolled = supplier.enrollmentStatus === 'ENROLLED';
  const handleUnenroll = useCallback(async () => {
    const confirmed = await confirm({
      title: `Unenroll "${supplier.partyName}" from ${siteLabel}?`,
      description: 'The site will no longer be able to purchase from this supplier. Its price history is kept.',
      confirmLabel: 'Unenroll',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(supplierRef);
  }, [supplier, siteLabel, supplierRef, confirm, deleteMutation]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.partyName}
        titleSlot={
          enrolled ? (
            <div className="flex items-center gap-2">
              <Badge variant="success">Enrolled</Badge>
              <StatusSwitch
                size="md"
                checked={supplier.isActive === true}
                permission={binding.permissions.editEnroll}
                disabled={!supplier.isSupplierActive}
                disabledTip={
                  'This supplier is deactivated at LE, so it cannot be bought from at any site. Activate the supplier first.'
                }
                isLoading={setActiveMutation.isPending}
                onCheckedChange={(isActive) => setActiveMutation.mutate({ ...supplierRef, isActive })}
                ariaLabel={`Mark ${supplier.partyName} active at ${siteLabel}`}
              />
            </div>
          ) : (
            <Badge variant="outline">Not Enrolled</Badge>
          )
        }
        description={supplier.siteName ? `${supplier.supplierCode} · ${supplier.siteName}` : supplier.supplierCode}
        actions={
          enrolled ? (
            <Button
              variant="outline"
              size="sm"
              permission={binding.permissions.editEnroll}
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
            >
              Edit Enrollment
            </Button>
          ) : (
            <Button
              size="sm"
              permission={binding.permissions.enroll}
              startAdornment={<Plus className="size-4" />}
              onClick={enrollDialog.open}
            >
              Enroll Supplier
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: binding.permissions.view,
            content: (
              <OverviewTab
                supplier={supplier}
                enrollPermission={binding.permissions.enroll}
                onEnroll={enrollDialog.open}
              />
            ),
          },
          {
            value: 'site-items',
            label: 'Items',
            permission: binding.permissions.siteItems.view,
            content: <SiteItemsTab binding={binding} supplierRef={supplierRef} />,
          },
          {
            value: 'quotations',
            label: 'Quotations',
            permission: binding.quotations.permissions.siteView,
            content: (
              <QuotationsTab
                binding={binding.quotations}
                supplierId={supplierRef.supplierId}
                siteId={supplierRef.siteId}
              />
            ),
          },
          ...(binding.invoices
            ? [
                {
                  value: 'invoices',
                  label: 'Invoices',
                  permission: binding.invoices.permission,
                  content: <binding.invoices.Tab supplierId={supplierRef.supplierId} />,
                },
              ]
            : []),
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={enrollDialog}
        icon={Truck}
        title="Enroll Supplier"
        description={`Choose the payment term, tax registration, bank account and order contact for ${supplier.partyName}.`}
        content={(close) => <EnrollDialog binding={binding} pair={supplierRef} onSuccess={close} onCancel={close} />}
      />

      {enrolled && (
        <>
          <Dialog
            handle={editDialog}
            icon={Truck}
            title="Edit Enrollment"
            description="Update the payment term, tax registration, bank account and order contact."
            content={(close) => (
              <EditEnrollmentDialog
                binding={binding}
                pair={supplierRef}
                enrollment={supplier}
                onSuccess={close}
                onCancel={close}
              />
            )}
          />

          <DangerZone
            title="Unenroll from site"
            description={`${siteLabel[0].toUpperCase()}${siteLabel.slice(1)} will no longer be able to purchase from this supplier.`}
            buttonText="Unenroll Supplier"
            permission={binding.permissions.unenroll}
            onClick={handleUnenroll}
            isLoading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
};
