import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, FileText, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  SUPPLIER_QUOTATIONS_TABLE_KEY,
  SUPPLIER_SITE_QUOTATIONS_TABLE_KEY,
  useSupplierQuotationsTable,
  useSupplierSiteQuotationsTable,
} from '@/hooks/legal-entity/supplier-quotations';
import type { SupplierQuotationData } from '@/schemas/supplier-quotations';
import { SupplierQuotationDialog } from '../quotations/forms/SupplierQuotationDialog';
import { QuotationStatusBadge } from '../quotations/QuotationStatusBadge';

interface QuotationsTabProps {
  supplierId: string;
  // The supplier's default currency and every currency it trades in, for a new quotation; the site view hands adding over
  // to the supplier's Quotations tab
  currencyCode?: string;
  currencyCodes?: string[];
  // Narrows the table to the quotations posted to this site, as the supplier's site view shows them
  siteId?: string;
}

export const QuotationsTab: React.FC<QuotationsTabProps> = ({ supplierId, siteId, currencyCode, currencyCodes }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { detail: tab } = useParams();
  const addDialog = useDialog();
  const supplierTable = useSupplierQuotationsTable(supplierId, { enabled: !siteId });
  const siteTable = useSupplierSiteQuotationsTable(supplierId, siteId);
  const { data: response, isLoading } = siteId ? siteTable : supplierTable;
  const tableKey = siteId
    ? SUPPLIER_SITE_QUOTATIONS_TABLE_KEY(supplierId, siteId)
    : SUPPLIER_QUOTATIONS_TABLE_KEY(supplierId);
  // From the tab URL (…/<supplier>/quotations) a quotation is one segment deeper, and from a site view
  // (…/<supplier>/<siteId>) it sits beside the site; its number names the crumb
  const quotationPath = useCallback(
    (quotation: Pick<SupplierQuotationData, 'id' | 'quotationNumber'>) => {
      const slug = buildSlug(quotation.quotationNumber, quotation.id);
      if (siteId) return `../quotations/${slug}`;
      return tab === 'quotations' ? slug : `quotations/${slug}`;
    },
    [tab, siteId],
  );

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
      ...(siteId
        ? []
        : [
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
          ]),
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
                permission: LE_SUPPLIERS.quotations.view,
                onClick: () => navigate(quotationPath(row.original), { relative: 'path' }),
              },
            ]}
          />
        ),
      },
    ],
    [navigate, quotationPath, siteId],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: siteId
      ? `commerce-le-supplier-${supplierId}-site-${siteId}-quotations`
      : `commerce-supplier-${supplierId}-quotations`,
    label: 'quotation',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: tableKey }),
  });

  // A quotation is recorded on the supplier, so the site view hands Add Quotation over to the supplier's Quotations tab,
  // which opens the dialog on arrival
  const location = useLocation();
  const openAdd = useCallback(() => {
    if (siteId) navigate('../quotations', { relative: 'path', state: { addQuotation: true } });
    else addDialog.open();
  }, [siteId, navigate, addDialog]);
  useEffect(() => {
    if (siteId || !(location.state as { addQuotation?: boolean } | null)?.addQuotation) return;
    addDialog.open();
    navigate(location.pathname, { replace: true, state: null });
  }, [siteId, location.state, location.pathname, addDialog, navigate]);

  const addButton = (
    <Button
      size="sm"
      permission={LE_SUPPLIERS.quotations.add}
      startAdornment={<Plus className="size-4" />}
      onClick={openAdd}
    >
      Add Quotation
    </Button>
  );

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.quotations.view}
        searchConfig={{ columns: [{ id: 'quotationNumber', label: 'Quotation' }], searchAll: true }}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={
          siteId
            ? {
                icon: FileText,
                title: 'No quotations at this site',
                description: "Post one of the supplier's quotations to this site from the quotation's Sites tab.",
                action: addButton,
              }
            : {
                icon: FileText,
                title: 'No quotations',
                description: "Record the supplier's quotation, add its lines, then post it to the sites it applies to.",
                action: addButton,
              }
        }
      />
      <Dialog
        handle={addDialog}
        icon={FileText}
        title="Add Quotation"
        description="Starts a draft. Add its lines next, then post it to sites to make them their prices."
        content={(close) => (
          <SupplierQuotationDialog
            supplierId={supplierId}
            currencyCode={currencyCode ?? ''}
            currencyCodes={currencyCodes ?? []}
            onSuccess={(created) => {
              close();
              if (created) navigate(quotationPath(created), { relative: 'path' });
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
