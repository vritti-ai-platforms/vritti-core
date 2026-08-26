import { useQueryClient } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Pencil, Phone } from 'lucide-react';
import { useMemo } from 'react';
import { useWhatsappPhoneNumbers, WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappPhoneNumberData } from '@/schemas/whatsapp-phone-numbers';
import { EditPhoneNumberProfileDialog } from './forms/EditPhoneNumberProfileDialog';

// Add-number flow is parked until the pre-add safeguards are designed (consumer-app warning +
// friendlier mapping of Meta's "number already on WhatsApp" rejection). The wizard
// (forms/AddPhoneNumberDialog.tsx), its hooks, and the gateway routes all remain functional —
// uncomment the marked blocks below to re-enable.
// import { Button } from '@vritti/quantum-ui/Button';
// import { Dialog } from '@vritti/quantum-ui/Dialog';
// import { useDialog } from '@vritti/quantum-ui/hooks';
// import { Plus } from 'lucide-react';
// import { AddPhoneNumberDialog } from './forms/AddPhoneNumberDialog';

interface PhoneNumbersTabProps {
  accountId: string;
}

// Meta's ownership verification status for the number
const VerificationBadge = ({ status }: { status: string | null }) => {
  if (status === 'VERIFIED') return <Badge variant="success">Verified</Badge>;
  if (status === 'PENDING') return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="outline">Not verified</Badge>;
};

// Meta's messaging quality rating (GREEN/YELLOW/RED, UNKNOWN until traffic flows)
const QualityBadge = ({ rating }: { rating: string | null }) => {
  if (!rating || rating === 'UNKNOWN') return <Badge variant="outline">Unknown</Badge>;
  if (rating === 'GREEN') return <Badge variant="success">Good</Badge>;
  if (rating === 'RED') return <Badge variant="destructive">Low</Badge>;
  return <Badge variant="secondary">{rating.toLowerCase()}</Badge>;
};

// Meta's display name review status — NONE (never requested) renders as nothing
const NameStatusBadge = ({ status }: { status: string | null }) => {
  if (!status || status === 'NONE') return null;
  if (status === 'APPROVED' || status === 'AVAILABLE_WITHOUT_REVIEW') return <Badge variant="success">Approved</Badge>;
  if (status === 'PENDING_REVIEW') return <Badge variant="secondary">Pending review</Badge>;
  if (status === 'DECLINED') return <Badge variant="destructive">Declined</Badge>;
  return <Badge variant="outline">{status.toLowerCase()}</Badge>;
};

// Rows are read live from Meta — verification status and quality are always current
export const PhoneNumbersTab = ({ accountId }: PhoneNumbersTabProps) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useWhatsappPhoneNumbers(accountId);
  // const addDialog = useDialog();

  // Every column carries an explicit size: DataTable takes the table's minWidth from their total, so the
  // TanStack default of 150px each would force a horizontal scrollbar the content does not need.
  const columns = useMemo<ColumnDef<WhatsappPhoneNumberData>[]>(
    () => [
      {
        accessorKey: 'displayPhoneNumber',
        header: 'Number',
        cell: ({ row }) => <StringCell value={row.original.displayPhoneNumber} mono />,
        enableSorting: false,
        size: 190,
      },
      {
        accessorKey: 'verifiedName',
        header: 'Display name',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            {row.original.verifiedName}
            <NameStatusBadge status={row.original.nameStatus} />
          </span>
        ),
        enableSorting: false,
        size: 220,
      },
      {
        accessorKey: 'codeVerificationStatus',
        header: 'Verification',
        cell: ({ row }) => <VerificationBadge status={row.original.codeVerificationStatus} />,
        enableSorting: false,
        size: 130,
      },
      {
        accessorKey: 'qualityRating',
        header: 'Quality',
        cell: ({ row }) => <QualityBadge rating={row.original.qualityRating} />,
        enableSorting: false,
        size: 110,
      },
      {
        accessorKey: 'platformType',
        header: 'Platform',
        cell: ({ row }) =>
          row.original.platformType ? <Badge variant="outline">{row.original.platformType}</Badge> : null,
        enableSorting: false,
        size: 130,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit-profile',
                icon: Pencil,
                label: 'Edit profile',
                permission: ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit,
                dialog: {
                  title: 'Edit profile',
                  description: `Business profile of ${row.original.displayPhoneNumber} — the picture applies immediately, name changes go through Meta review.`,
                  content: (close) => (
                    <EditPhoneNumberProfileDialog
                      accountId={accountId}
                      phoneNumber={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 70,
      },
    ],
    [accountId],
  );

  // Sorting is off deliberately: the rows come live from Meta, which cannot sort or filter this list
  const { table } = useDataTable({
    columns,
    slug: 'communications-org-whatsapp-phone-numbers',
    label: 'phone number',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(accountId) }),
  });

  return (
    <div className="flex flex-col gap-6">
      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_WHATSAPP_ACCOUNTS.phoneNumbers.view}
        enableViews={false}
        /* Parked add-number entry points — see the note at the top of this file
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit}
              onClick={addDialog.open}
            >
              Add number
            </Button>
          ),
        }}
        */
        emptyStateConfig={{
          icon: Phone,
          title: 'No phone numbers yet',
          description: 'Numbers added to this WhatsApp Business Account in Meta appear here.',
          /* Parked add-number entry points — see the note at the top of this file
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit}
              onClick={addDialog.open}
            >
              Add number
            </Button>
          ),
          */
        }}
      />

      {/* Parked add-number entry points — see the note at the top of this file
      <Dialog
        handle={addDialog}
        icon={Phone}
        title="Add phone number"
        description="Adds the number to this WhatsApp Business Account, then verifies and registers it for messaging."
        content={(close) => <AddPhoneNumberDialog accountId={accountId} onSuccess={close} onCancel={close} />}
      />
      */}
    </div>
  );
};
