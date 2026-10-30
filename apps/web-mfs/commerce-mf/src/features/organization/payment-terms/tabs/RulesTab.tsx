import { useQueryClient } from '@tanstack/react-query';
import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  type RowAction,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { PAYMENT_TERM_KEY, useDeletePaymentTermRule } from '@/hooks/organization/payment-terms';
import type { PaymentTermData, PaymentTermRuleData } from '@/schemas/payment-terms';
import { PaymentTermRuleDialog } from '../forms/PaymentTermRuleDialog';

interface RulesTabProps {
  paymentTerm: PaymentTermData;
}

export const RulesTab = ({ paymentTerm }: RulesTabProps) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const deleteMutation = useDeletePaymentTermRule();
  const isDraft = paymentTerm.status === 'DRAFT';
  const lockedTip = isDraft ? undefined : 'Rules can only change while the payment term is a draft';
  const remainingPercent = Math.max(0, Math.round((100 - paymentTerm.totalPercent) * 100) / 100);

  const handleDelete = useCallback(
    async (rule: PaymentTermRuleData) => {
      const ok = await confirm({
        title: 'Delete this rule?',
        description: `Removes the ${rule.percent}% due after ${rule.dueDays} days.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate({ paymentTermId: paymentTerm.id, ruleId: rule.id });
    },
    [confirm, deleteMutation, paymentTerm.id],
  );

  const columns = useMemo<ColumnDef<PaymentTermRuleData>[]>(
    () => [
      {
        accessorKey: 'percent',
        header: 'Share (%)',
        cell: ({ row }) => <NumberCell value={row.original.percent} />,
      },
      {
        accessorKey: 'dueDays',
        header: 'Due After (days)',
        cell: ({ row }) => <NumberCell value={row.original.dueDays} />,
      },
      {
        accessorKey: 'discountPercent',
        header: 'Discount (%)',
        cell: ({ row }) => <NumberCell value={row.original.discountPercent} />,
      },
      {
        accessorKey: 'discountDays',
        header: 'If Paid Within (days)',
        cell: ({ row }) => <NumberCell value={row.original.discountDays} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const rule = row.original;
          const actions: RowAction[] = [
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              permission: ORG_PAYMENT_TERMS.edit,
              disabled: !isDraft,
              disabledTip: lockedTip,
              dialog: {
                title: 'Edit Rule',
                description: 'Change how much of the invoice falls due and when.',
                content: (close) => (
                  <PaymentTermRuleDialog
                    paymentTermId={paymentTerm.id}
                    rule={rule}
                    remainingPercent={remainingPercent}
                    onSuccess={close}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_PAYMENT_TERMS.edit,
              disabled: !isDraft,
              disabledTip: lockedTip,
              onClick: () => handleDelete(rule),
            },
          ];
          return <RowActions actions={actions} />;
        },
      },
    ],
    [handleDelete, isDraft, lockedTip, paymentTerm.id, remainingPercent],
  );

  const { table } = useDataTable({
    columns,
    serverState: { result: paymentTerm.lines, count: paymentTerm.lines.length },
    slug: 'commerce-org-payment-term-rules',
    label: 'rule',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: PAYMENT_TERM_KEY(paymentTerm.id) }),
  });

  const addButton = (
    <Button
      size="sm"
      permission={ORG_PAYMENT_TERMS.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!isDraft}
      disabledTip={lockedTip}
    >
      Add Rule
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      {isDraft && paymentTerm.totalPercent !== 100 && (
        <Alert
          variant="warning"
          title={paymentTerm.lines.length === 0 ? 'Add rules to activate' : `Rules total ${paymentTerm.totalPercent}%`}
          description="A payment term can be activated once it has at least one rule and its rules add up to exactly 100% of the invoice."
        />
      )}

      <DataTable
        table={table}
        mode="tab"
        permission={ORG_PAYMENT_TERMS.view}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: ListOrdered,
          title: 'No rules yet',
          description:
            'Add a rule for each part of the invoice and when it falls due. A single rule of 100% is a plain net term.',
          action: addButton,
        }}
      />

      <Dialog
        handle={addDialog}
        icon={ListOrdered}
        title="Add Rule"
        description="Make part of the invoice due a number of days after the baseline date."
        content={(close) => (
          <PaymentTermRuleDialog
            paymentTermId={paymentTerm.id}
            remainingPercent={remainingPercent}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
