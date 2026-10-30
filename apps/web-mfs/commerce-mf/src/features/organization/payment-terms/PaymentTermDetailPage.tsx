import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CalendarClock, CircleCheck, CircleSlash, Pencil } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useActivatePaymentTerm,
  useDeactivatePaymentTerm,
  useDeletePaymentTerm,
  usePaymentTerm,
} from '@/hooks/organization/payment-terms';
import { EditPaymentTermDialog } from './forms/EditPaymentTermDialog';
import { PaymentTermStatusBadge } from './PaymentTermStatusBadge';
import { OverviewTab } from './tabs/OverviewTab';
import { RulesTab } from './tabs/RulesTab';

export const PaymentTermDetailPage = () => {
  const { id } = useSlugParams('paymentTermSlug');
  const navigate = useNavigate();
  const { data: paymentTerm } = usePaymentTerm(id);
  const editDialog = useDialog();
  const confirm = useConfirm();
  const activateMutation = useActivatePaymentTerm();
  const deactivateMutation = useDeactivatePaymentTerm();
  const deleteMutation = useDeletePaymentTerm();
  const canActivate = paymentTerm.lines.length > 0 && paymentTerm.totalPercent === 100;

  const handleActivate = useCallback(async () => {
    const ok = await confirm({
      title: `Activate "${paymentTerm.name}"?`,
      description:
        paymentTerm.status === 'DRAFT'
          ? 'Its rules lock once it is active, and it becomes available to suppliers and site enrollments.'
          : 'It becomes available to suppliers and site enrollments again.',
      confirmLabel: 'Activate',
    });
    if (ok) activateMutation.mutate(paymentTerm.id);
  }, [confirm, activateMutation, paymentTerm]);

  const handleDeactivate = useCallback(async () => {
    const ok = await confirm({
      title: `Deactivate "${paymentTerm.name}"?`,
      description: 'It can no longer be picked. Suppliers and site enrollments already on it keep it.',
      confirmLabel: 'Deactivate',
    });
    if (ok) deactivateMutation.mutate(paymentTerm.id);
  }, [confirm, deactivateMutation, paymentTerm]);

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete "${paymentTerm.name}"?`,
      description: 'This permanently removes the payment term and its rules.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(paymentTerm.id, { onSuccess: () => navigate('../..', { relative: 'path' }) });
  }, [confirm, deleteMutation, navigate, paymentTerm]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={paymentTerm.name}
        titleSlot={<PaymentTermStatusBadge status={paymentTerm.status} />}
        description={paymentTerm.code}
        actions={
          <div className="flex items-center gap-2">
            {paymentTerm.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                size="sm"
                permission={ORG_PAYMENT_TERMS.edit}
                startAdornment={<CircleSlash className="size-4" />}
                onClick={handleDeactivate}
                isLoading={deactivateMutation.isPending}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                permission={ORG_PAYMENT_TERMS.edit}
                startAdornment={<CircleCheck className="size-4" />}
                onClick={handleActivate}
                isLoading={activateMutation.isPending}
                disabled={!canActivate}
              >
                Activate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              permission={ORG_PAYMENT_TERMS.edit}
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
            >
              Edit
            </Button>
          </div>
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_PAYMENT_TERMS.view,
            content: <OverviewTab paymentTerm={paymentTerm} />,
          },
          {
            value: 'rules',
            label: `Rules (${paymentTerm.lines.length})`,
            permission: ORG_PAYMENT_TERMS.view,
            content: <RulesTab paymentTerm={paymentTerm} />,
          },
        ]}
      />

      <Dialog
        handle={editDialog}
        icon={CalendarClock}
        title="Edit Payment Term"
        description={`Update the payment term. It has ${pluralize('rule', paymentTerm.lines.length, true)}.`}
        content={(close) => <EditPaymentTermDialog paymentTerm={paymentTerm} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this payment term"
        description="This action cannot be undone. Terms used by a supplier or site enrollment cannot be deleted — deactivate them instead."
        buttonText="Delete Payment Term"
        permission={ORG_PAYMENT_TERMS.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
