import { useQueryClient } from '@tanstack/react-query';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  NumberCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { MessageSquareText } from 'lucide-react';
import { useMemo } from 'react';
import { SMS_OTPS_TABLE_KEY, useSmsOtps } from '@/hooks/organization/sms-otps';
import type { SmsOtpData, SmsOtpStatus } from '@/schemas/sms-otps';

const STATUS_VARIANT: Record<SmsOtpStatus, 'success' | 'secondary' | 'outline' | 'destructive'> = {
  SENT: 'outline',
  DELIVERED: 'secondary',
  VERIFIED: 'success',
  FAILED: 'destructive',
};

const STATUS_LABEL: Record<SmsOtpStatus, string> = {
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  VERIFIED: 'Verified',
  FAILED: 'Failed',
};

export const OtpsTab = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSmsOtps();

  const columns = useMemo<ColumnDef<SmsOtpData>[]>(
    () => [
      {
        accessorKey: 'recipient',
        header: 'Recipient',
        cell: ({ row }) => <StringCell value={row.original.recipient} mono />,
        enableSorting: true,
        size: 180,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const badge = (
            <Badge variant={STATUS_VARIANT[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>
          );
          // The failure reason is the whole point of a FAILED row, but it is too long for a cell —
          // surface it on hover rather than adding a column nobody reads
          return row.original.error ? <Tooltip content={row.original.error}>{badge}</Tooltip> : badge;
        },
        enableSorting: false,
        size: 120,
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: ({ row }) => <Badge variant="outline">{row.original.provider.toLowerCase()}</Badge>,
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: 'attempts',
        header: 'Attempts',
        cell: ({ row }) => <NumberCell value={row.original.attempts} />,
        enableSorting: true,
        size: 100,
      },
      {
        accessorKey: 'appId',
        header: 'App',
        cell: ({ row }) => <StringCell value={row.original.appId} mono />,
        enableSorting: true,
        size: 220,
      },
      {
        accessorKey: 'createdAt',
        header: 'Sent',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
        enableSorting: true,
        size: 170,
      },
      {
        accessorKey: 'verifiedAt',
        header: 'Verified',
        cell: ({ row }) => <DateTimeCell value={row.original.verifiedAt} />,
        enableSorting: true,
        size: 170,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    slug: 'communications-org-sms-otps',
    label: 'OTP',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SMS_OTPS_TABLE_KEY }),
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      mode="tab"
      permission={ORG_SMS_OTPS.view}
      searchConfig={{
        columns: [
          { id: 'recipient', label: 'Recipient' },
          { id: 'appId', label: 'App' },
        ],
        searchAll: true,
      }}
      filters={[
        <SelectFilter
          key="isVerified"
          name="isVerified"
          label="Verified"
          options={[
            { label: 'Verified', value: 'true' },
            { label: 'Not verified', value: 'false' },
          ]}
        />,
      ]}
      emptyStateConfig={{
        icon: MessageSquareText,
        title: 'No OTPs yet',
        description: 'OTPs appear here once an app is configured to send them and a customer requests one.',
      }}
    />
  );
};
