import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CalendarClock, Pencil, Send, Undo2 } from 'lucide-react';
import { Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeletePaymentTerm,
  usePaymentTerm,
  usePaymentTermCounts,
  usePublishPaymentTerm,
  useUnpublishPaymentTerm,
} from '@/hooks/organization/payment-terms';
import { PaymentTermStatusBadge } from './components/PaymentTermStatusBadge';
import { ChangeBaselineDialog } from './forms/ChangeBaselineDialog';
import { EditPaymentTermDialog } from './forms/EditPaymentTermDialog';
import { OverviewTab } from './tabs/OverviewTab';
import { RulesTab } from './tabs/RulesTab';
import { RulesTabSkeleton } from './tabs/RulesTabSkeleton';

export const PaymentTermDetailPage = () => {
  const { id } = useSlugParams('paymentTermSlug');
  const navigate = useNavigate();
  const { data: paymentTerm } = usePaymentTerm(id);
  const { data: counts, isLoading: countsLoading } = usePaymentTermCounts(id);
  const editDialog = useDialog();
  const baselineDialog = useDialog();
  const confirm = useConfirm();
  const publishMutation = usePublishPaymentTerm();
  const unpublishMutation = useUnpublishPaymentTerm();
  const usedBy = [
    paymentTerm.supplierCount > 0 && `${pluralize('supplier', paymentTerm.supplierCount, true)} (as their default)`,
    paymentTerm.enrollmentCount > 0 && pluralize('site enrollment', paymentTerm.enrollmentCount, true),
  ].filter(Boolean);
  const inUseTip = `Used by ${usedBy.join(' and ')}. Move them to another payment term first.`;
  const deleteMutation = useDeletePaymentTerm();

  const handlePublish = useCallback(async () => {
    const ok = await confirm({
      title: `Publish "${paymentTerm.name}"?`,
      description: 'It becomes available to suppliers and site enrollments. Unpublish it to edit it again.',
      confirmLabel: 'Publish',
    });
    if (ok) publishMutation.mutate(paymentTerm.id);
  }, [confirm, publishMutation, paymentTerm]);

  const handleUnpublish = useCallback(async () => {
    const ok = await confirm({
      title: `Unpublish "${paymentTerm.name}"?`,
      description: 'It returns to draft so you can edit it, and can no longer be picked until you publish it again.',
      confirmLabel: 'Unpublish',
    });
    if (ok) unpublishMutation.mutate(paymentTerm.id);
  }, [confirm, unpublishMutation, paymentTerm]);

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
        titleSlot={<PaymentTermStatusBadge isPublished={paymentTerm.isPublished} />}
        actions={
          <div className="flex items-center gap-2">
            {paymentTerm.isPublished ? (
              <Button
                variant="outline"
                size="sm"
                permission={ORG_PAYMENT_TERMS.publish}
                startAdornment={<Undo2 className="size-4" />}
                onClick={handleUnpublish}
                isLoading={unpublishMutation.isPending}
                disabled={!paymentTerm.canUnpublish}
                disabledTip={inUseTip}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                permission={ORG_PAYMENT_TERMS.publish}
                startAdornment={<Send className="size-4" />}
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                disabled={!paymentTerm.canPublish}
                disabledTip="Rules must total exactly 100% to publish"
              >
                Publish
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              permission={ORG_PAYMENT_TERMS.edit}
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
              disabled={paymentTerm.isPublished}
              disabledTip="Unpublish the payment term to edit it"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              permission={ORG_PAYMENT_TERMS.baseline.edit}
              startAdornment={<CalendarClock className="size-4" />}
              onClick={baselineDialog.open}
              disabled={paymentTerm.isPublished}
              disabledTip="Unpublish the payment term to change its baseline"
            >
              Change Baseline
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
            label: 'Rules',
            count: counts?.ruleCount,
            countLoading: countsLoading,
            permission: ORG_PAYMENT_TERMS.rules.view,
            content: (
              <Suspense fallback={<RulesTabSkeleton />}>
                <RulesTab paymentTerm={paymentTerm} />
              </Suspense>
            ),
          },
        ]}
      />

      <Dialog
        handle={editDialog}
        icon={CalendarClock}
        title="Edit Payment Term"
        description={`Update the payment term. It has ${pluralize('rule', paymentTerm.ruleCount, true)}.`}
        content={(close) => <EditPaymentTermDialog paymentTerm={paymentTerm} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={baselineDialog}
        icon={CalendarClock}
        title="Change Baseline"
        description="Move the date the due days count from. Every rule's due date shifts with it."
        content={(close) => <ChangeBaselineDialog paymentTerm={paymentTerm} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this payment term"
        description="This action cannot be undone. Terms a supplier uses cannot be deleted."
        buttonText="Delete Payment Term"
        permission={ORG_PAYMENT_TERMS.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={!paymentTerm.canDelete || deleteMutation.isPending}
        warning={inUseTip}
        showWarning={!paymentTerm.canDelete}
      />
    </div>
  );
};
