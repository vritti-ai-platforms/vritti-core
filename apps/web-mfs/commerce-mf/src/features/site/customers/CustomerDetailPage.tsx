import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer, useDeleteCustomer } from '@/hooks/site/customers';
import { EditCustomerForm } from './forms/EditCustomerForm';
import { OverviewTab } from './tabs/OverviewTab';

export const CustomerDetailPage = () => {
  const { id } = useSlugParams('customerSlug');
  const navigate = useNavigate();
  const { data: customer } = useCustomer(id);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteCustomer();

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${customer.name}"?`,
      description: 'This customer will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(customer.id, { onSuccess: () => navigate('..') });
    }
  }, [customer, confirm, deleteMutation, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.name}
        description={customer.phone ?? customer.email ?? undefined}
        actions={
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab customer={customer} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        icon={Users}
        title="Edit Customer"
        description="Update the customer details."
        className="max-w-3xl"
        content={(close) => <EditCustomerForm customer={customer} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this customer"
        description="This action cannot be undone. The customer will be permanently removed."
        buttonText="Delete Customer"
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
