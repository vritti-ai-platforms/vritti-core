import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Plus, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierSiteBinding } from './bindings';
import { EditEnrollmentDialog } from './forms/EditEnrollmentDialog';
import { EnrollAtSiteDialog } from './forms/EnrollAtSiteDialog';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

interface SupplierSiteDetailProps {
  binding: SupplierSiteBinding;
}

// A supplier as one site sees it — enrolled or not: enrollment, the items the site buys, and removal from the site
export const SupplierSiteDetail: React.FC<SupplierSiteDetailProps> = ({ binding }) => {
  const supplierRef = binding.useSupplierRef();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: supplier } = binding.useSupplierAtSite(supplierRef);
  const navigate = useNavigate();
  const exitPath = binding.useExitPath();
  const confirm = useConfirm();
  const editDialog = useDialog();
  const enrollDialog = useDialog();
  const removeMutation = binding.useRemoveEnrollment(supplierRef, { onSuccess: () => navigate(exitPath) });

  const siteLabel = supplier.siteName ?? 'this site';
  const enrollmentId = supplier.enrollmentId;
  const handleUnenroll = useCallback(async () => {
    const confirmed = await confirm({
      title: `Unenroll "${supplier.partyName}" from ${siteLabel}?`,
      description: 'The site will no longer be able to purchase from this supplier. Its price history is kept.',
      confirmLabel: 'Unenroll',
      variant: 'destructive',
    });
    if (confirmed && enrollmentId) removeMutation.mutate(enrollmentId);
  }, [supplier, siteLabel, enrollmentId, confirm, removeMutation]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.partyName}
        titleSlot={
          enrollmentId ? <Badge variant="success">Enrolled</Badge> : <Badge variant="outline">Not Enrolled</Badge>
        }
        description={supplier.siteName ? `${supplier.code} · ${supplier.siteName}` : supplier.code}
        actions={
          enrollmentId ? (
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
            value: 'items',
            label: 'Items',
            permission: binding.permissions.items.view,
            content: <ItemsTab binding={binding} supplierRef={supplierRef} />,
          },
          ...(binding.quotations
            ? [
                {
                  value: 'quotations',
                  label: 'Quotations',
                  permission: binding.quotations.permission,
                  content: <binding.quotations.Tab supplierId={supplierRef.supplierId} siteId={supplierRef.siteId} />,
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
        content={(close) => (
          <EnrollAtSiteDialog
            binding={binding}
            supplierRef={supplierRef}
            supplier={supplier}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      {enrollmentId && (
        <>
          <Dialog
            handle={editDialog}
            icon={Truck}
            title="Edit Enrollment"
            description="Update the payment term, tax registration, bank account and order contact."
            content={(close) => (
              <EditEnrollmentDialog
                binding={binding}
                supplierRef={supplierRef}
                supplier={supplier}
                enrollmentId={enrollmentId}
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
            isLoading={removeMutation.isPending}
            disabled={removeMutation.isPending}
          />
        </>
      )}
    </div>
  );
};
