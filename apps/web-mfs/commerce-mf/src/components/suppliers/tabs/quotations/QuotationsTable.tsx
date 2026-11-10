import { useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  DataTable,
  type DataTableQuery,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Eye, FileText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierQuotationData } from '@/schemas/supplier-quotations';
import { QuotationStatusBadge } from './QuotationStatusBadge';

interface QuotationsTableProps {
  query: DataTableQuery<SupplierQuotationData>;
  slug: string;
  queryKey: readonly unknown[];
  permission: string;
  // A quotation's page, relative to the table's URL path
  quotationPath: (quotation: Pick<SupplierQuotationData, 'id' | 'quotationNumber'>) => string;
  // Where every site's postings are visible: how many sites a quotation is posted to and whether it is posted at all
  showPosting?: boolean;
  toolbarAction?: React.ReactNode;
  emptyState: { title: string; description: string };
}

// A supplier's quotations, newest first; a row opens its quotation
export const QuotationsTable: React.FC<QuotationsTableProps> = ({
  query,
  slug,
  queryKey,
  permission,
  quotationPath,
  showPosting = false,
  toolbarAction,
  emptyState,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<SupplierQuotationData>[]>(
    () => [
      {
        accessorKey: 'quotationNumber',
        header: 'Quotation',
        cell: ({ row }) => <StringCell value={row.original.quotationNumber} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'quotationDate',
        header: 'Date',
        cell: ({ row }) => <DateCell value={row.original.quotationDate} />,
        enableSorting: true,
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currency',
        cell: ({ row }) => <StringCell value={row.original.currencyCode} mono />,
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid From',
        cell: ({ row }) => <DateCell value={row.original.validFrom} />,
        enableSorting: true,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid To',
        cell: ({ row }) => <DateCell value={row.original.validTo} />,
        enableSorting: true,
      },
      { accessorKey: 'itemCount', header: 'Lines', cell: ({ row }) => <NumberCell value={row.original.itemCount} /> },
      ...(showPosting
        ? [
            {
              accessorKey: 'siteCount',
              header: 'Sites',
              cell: ({ row }) => <NumberCell value={row.original.siteCount} />,
            } satisfies ColumnDef<SupplierQuotationData>,
            {
              accessorKey: 'status',
              header: 'Status',
              cell: ({ row }) => <QuotationStatusBadge status={row.original.status} />,
            } satisfies ColumnDef<SupplierQuotationData>,
          ]
        : []),
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                permission,
                onClick: () => navigate(quotationPath(row.original), { relative: 'path' }),
              },
            ]}
          />
        ),
      },
    ],
    [navigate, quotationPath, permission, showPosting],
  );

  const quotationsTable = useDataTable({
    columns,
    query,
    slug,
    label: 'quotation',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <DataTable
      table={quotationsTable}
      mode="tab"
      permission={permission}
      onRowClick={(quotation) => navigate(quotationPath(quotation), { relative: 'path' })}
      searchConfig={{ columns: [{ id: 'quotationNumber', label: 'Quotation' }], searchAll: true }}
      toolbarActions={toolbarAction ? { actions: toolbarAction } : undefined}
      emptyStateConfig={{ icon: FileText, ...emptyState, action: toolbarAction }}
    />
  );
};
