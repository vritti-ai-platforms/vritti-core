import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Eye, Truck } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItemSupplierData } from '@/schemas/suppliers';
import { SiteFilter } from '@/selectors/site';
import type { UseInventoryItemSuppliersTable } from '../types';

interface SuppliersTabProps {
  inventoryItemId: string;
  useSuppliersTable: UseInventoryItemSuppliersTable;
  tableKey: readonly unknown[];
  tableSlug: string;
  permission?: string;
  showSiteTerms?: boolean;
  // A clearable site in the context bar; picking one narrows the table to the suppliers of that site, with their terms there
  siteContext?: boolean;
  // Where a supplier's View action goes (absolute) and who may follow it; without it the rows have no View action
  supplierView?: { path: (row: InventoryItemSupplierData) => string; permission: string };
  // The scope's way to add a supplier, shown in the toolbar and the empty state
  addAction?: React.ReactNode;
}

const SITE_TERM_COLUMNS: ColumnDef<InventoryItemSupplierData>[] = [
  {
    accessorKey: 'unitPrice',
    header: 'Unit Price',
    enableSorting: false,
    cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
  },
  {
    accessorKey: 'minOrderQuantity',
    header: 'Min Order',
    cell: ({ row }) =>
      row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
  },
  {
    accessorKey: 'leadTimeDays',
    header: 'Lead Time',
    cell: ({ row }) => `${row.original.leadTimeDays} d`,
  },
  {
    accessorKey: 'isPreferred',
    header: 'Preferred',
    cell: ({ row }) => (row.original.isPreferred ? <Badge variant="success">Yes</Badge> : '—'),
  },
];

export const SuppliersTab: React.FC<SuppliersTabProps> = ({
  inventoryItemId,
  useSuppliersTable,
  tableKey,
  tableSlug,
  permission,
  showSiteTerms = false,
  siteContext = false,
  supplierView,
  addAction,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const suppliersTableQuery = useSuppliersTable(inventoryItemId);
  // The columns follow the site the rows came back for, so they always match the data shown
  const rowsSite = siteContext
    ? suppliersTableQuery.data?.state.filters.context?.find((condition) => condition.field === 'site')?.value
    : undefined;
  const showsSiteTerms = showSiteTerms || typeof rowsSite === 'string';

  const columns = useMemo<ColumnDef<InventoryItemSupplierData>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.supplierName ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{row.original.supplierCode ?? ''}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      ...(showsSiteTerms
        ? SITE_TERM_COLUMNS
        : [
            {
              accessorKey: 'siteCount',
              header: 'Sites',
              cell: ({ row }: { row: { original: InventoryItemSupplierData } }) => (
                <NumberCell value={row.original.siteCount} />
              ),
            } satisfies ColumnDef<InventoryItemSupplierData>,
          ]),
      ...(supplierView
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              enableHiding: false,
              cell: ({ row }: { row: { original: InventoryItemSupplierData } }) => (
                <RowActions
                  actions={[
                    {
                      id: 'view',
                      icon: Eye,
                      label: 'View',
                      permission: supplierView.permission,
                      onClick: () => navigate(supplierView.path(row.original)),
                    },
                  ]}
                />
              ),
            } satisfies ColumnDef<InventoryItemSupplierData>,
          ]
        : []),
    ],
    [showsSiteTerms, supplierView, navigate],
  );

  const suppliersTable = useDataTable({
    columns,
    query: suppliersTableQuery,
    slug: tableSlug,
    label: 'supplier',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: tableKey }),
  });

  return (
    <DataTable
      table={suppliersTable}
      mode="tab"
      permission={permission}
      searchConfig={{
        columns: [
          { id: 'supplierName', label: 'Supplier name' },
          { id: 'supplierCode', label: 'Supplier code' },
          { id: 'supplierItemCode', label: 'Supplier item code' },
        ],
        searchAll: true,
      }}
      contextBar={
        siteContext ? (
          <SiteFilter name="site" label="Site" placeholder="All sites" mode="context" clearable />
        ) : undefined
      }
      filters={
        showsSiteTerms
          ? [
              <SelectFilter
                key="isPreferred"
                name="isPreferred"
                label="Preferred"
                options={[
                  { label: 'Preferred', value: 'true' },
                  { label: 'Not preferred', value: 'false' },
                ]}
              />,
            ]
          : undefined
      }
      toolbarActions={addAction ? { actions: addAction } : undefined}
      emptyStateConfig={{
        icon: Truck,
        title: 'No suppliers',
        description:
          typeof rowsSite === 'string'
            ? 'No supplier supplies this item to this site yet.'
            : addAction
              ? 'No suppliers carry this item yet. Add one to get started.'
              : 'No suppliers carry this item yet. Link this item from a supplier detail page to get started.',
        action: addAction,
      }}
    />
  );
};
