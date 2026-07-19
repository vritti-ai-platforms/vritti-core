import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  COMPANY_BANK_ACCOUNTS_TABLE_KEY,
  useCompanyBankAccountsTable,
  useDeleteCompanyBankAccount,
} from '@/hooks/organization/companies';
import type { PartyBankAccountRow } from '@/schemas/party-bank-accounts';
import { AddBankAccountDialog } from '../forms/AddBankAccountDialog';
import { EditBankAccountDialog } from '../forms/EditBankAccountDialog';

interface BankAccountsTabProps {
  companyId: string;
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({ companyId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useCompanyBankAccountsTable(companyId);
  const deleteMutation = useDeleteCompanyBankAccount(companyId);

  const handleDelete = useCallback(
    async (row: PartyBankAccountRow) => {
      const confirmed = await confirm({
        title: 'Delete bank account?',
        description: `Delete the account "${row.accountName}" (${row.accountNumber})?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyBankAccountRow>[]>(
    () => [
      {
        accessorKey: 'accountName',
        header: 'Account Name',
        cell: ({ row }) => <StringCell value={row.original.accountName} />,
      },
      {
        accessorKey: 'accountNumber',
        header: 'Account Number',
        cell: ({ row }) => <StringCell value={row.original.accountNumber} mono />,
      },
      {
        accessorKey: 'bankName',
        header: 'Bank',
        cell: ({ row }) => <StringCell value={row.original.bankName} />,
      },
      {
        accessorKey: 'ifscCode',
        header: 'IFSC',
        cell: ({ row }) => <StringCell value={row.original.ifscCode} mono />,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) => (row.original.isPrimary ? <Badge variant="success">Primary</Badge> : '—'),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: ORG_COMPANIES.bankAccounts.edit,
                dialog: {
                  title: 'Edit Bank Account',
                  description: 'Update the details for this bank account.',
                  content: (close) => (
                    <EditBankAccountDialog
                      companyId={companyId}
                      account={row.original}
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
                permission: ORG_COMPANIES.bankAccounts.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [companyId, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-org-company-${companyId}-bank-accounts`,
    label: 'bank account',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY(companyId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_COMPANIES.bankAccounts.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={ORG_COMPANIES.bankAccounts.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Account
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Landmark,
          title: 'No bank accounts',
          description: 'Record the bank accounts used to pay this company.',
          action: (
            <Button
              permission={ORG_COMPANIES.bankAccounts.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Account
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Landmark}
        title="Add Bank Account"
        description="Record a bank account for this company."
        content={(close) => <AddBankAccountDialog companyId={companyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
