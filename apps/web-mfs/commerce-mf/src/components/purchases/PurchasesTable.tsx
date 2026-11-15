import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SegmentedProgress, SegmentedProgressKey } from '@vritti/quantum-ui/SegmentedProgress';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type PurchaseData,
  type PurchaseTableRow,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import { SiteFilter } from '@/selectors/site';
import type { PurchasesBinding } from './bindings';
import { CreatePurchaseDialog } from './forms/CreatePurchaseDialog';
import { PurchaseStageBadge } from './PurchaseStageBadge';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { PurchasesListActions } from './PurchasesListActions';
import { PURCHASE_PROGRESS, purchaseProgressCaption, purchaseStageTip } from './purchaseState';

interface PurchasesTableProps {
  binding: PurchasesBinding;
  title: string;
  description: string;
}

const STATUS_OPTIONS = Object.entries(purchaseStatusConfig).map(([value, { label }]) => ({ label, value }));
const STEP_OPTIONS = Object.entries(purchaseStepConfig).map(([value, { label }]) => ({ label, value }));

// Purchases, newest first — at the legal entity, every site's or only the site filtered in the context bar; a row opens
// its purchase, New Purchase creates one at a site it picks, and the header creates a supplier invoice or opens a
// Receive with Invoice at the filtered site
export const PurchasesTable: React.FC<PurchasesTableProps> = ({ binding, title, description }) => {
  const { permissions, SupplierFilter } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const createDialog = useDialog();
  const purchasesTableQuery = binding.useTable();

  const openPurchase = useCallback(
    (purchase: Pick<PurchaseData, 'id' | 'purchaseNumber'>) =>
      navigate(buildSlug(purchase.purchaseNumber, purchase.id)),
    [navigate],
  );

  const columns = useMemo<ColumnDef<PurchaseTableRow>[]>(
    () => [
      {
        accessorKey: 'purchaseNumber',
        header: 'Purchase',
        cell: ({ row }) => <StringCell value={row.original.purchaseNumber} mono />,
        enableSorting: true,
        size: 200,
      },
      ...(binding.spansSites
        ? [
            {
              id: 'site',
              header: 'Site',
              cell: ({ row }) => row.original.siteName,
              enableSorting: false,
            } satisfies ColumnDef<PurchaseTableRow>,
          ]
        : []),
      {
        id: 'progress',
        header: () => (
          <div className="flex flex-col items-center gap-1">
            <span>Progress</span>
            <SegmentedProgressKey
              items={PURCHASE_PROGRESS.segments}
              trackLabel={PURCHASE_PROGRESS.track.label}
              className="justify-center font-normal"
            />
          </div>
        ),
        size: 420,
        meta: { grow: true, label: 'Progress' },
        cell: ({ row }) => (
          <div className="flex min-w-32 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <PurchaseStageBadge purchase={row.original} tip={purchaseStageTip(row.original)} />
              <Typography variant="caption" intent="muted">
                Created {fmt.date(row.original.createdAt).primary}
              </Typography>
            </div>
            <SegmentedProgress
              trackLabel={PURCHASE_PROGRESS.track.label}
              segments={PURCHASE_PROGRESS.segments.map(({ key, label }) => ({
                key,
                label,
                value: row.original.progress.segments[key],
              }))}
            />
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption" intent="muted">
                {purchaseProgressCaption(row.original.progress, fmt)}
              </Typography>
              <PurchaseStatusBadge purchase={row.original} />
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: permissions.view,
                onClick: () => openPurchase(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [fmt, permissions.view, openPurchase, binding.spansSites],
  );

  const purchasesTable = useDataTable({
    columns,
    slug: binding.tableSlug,
    label: 'purchase',
    query: purchasesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });
  const siteId = binding.spansSites ? purchasesTable.contextValue('siteId') : undefined;
  const needsSite = binding.spansSites && !siteId;

  const newPurchaseAction = (
    <Button
      size="sm"
      permission={permissions.add}
      startAdornment={<Plus className="size-4" />}
      onClick={createDialog.open}
    >
      New Purchase
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={<PurchasesListActions binding={binding} siteId={siteId} needsSite={needsSite} />}
      />
      <DataTable
        table={purchasesTable}
        permission={permissions.view}
        contextBar={
          <>
            {binding.spansSites && <SiteFilter name="siteId" label="Site" placeholder="All sites" mode="context" />}
            <SelectFilter key="status" name="status" label="Status" multiple options={STATUS_OPTIONS} mode="context" />
            <SelectFilter key="step" name="step" label="Stage" multiple options={STEP_OPTIONS} mode="context" />
          </>
        }
        searchConfig={{
          columns: [{ id: 'purchaseNumber', label: 'Purchase Number' }],
          searchAll: true,
        }}
        filters={[<SupplierFilter key="supplierId" />]}
        toolbarActions={{ actions: newPurchaseAction }}
        emptyStateConfig={{
          icon: ShoppingCart,
          title: 'No purchases',
          description: 'Start a purchase with what the site needs; suppliers are chosen when it is sourced.',
          action: newPurchaseAction,
        }}
      />

      <Dialog
        handle={createDialog}
        icon={ShoppingCart}
        title="New Purchase"
        description="Add the items you need next, then choose which suppliers to buy them from."
        content={(close) => (
          <CreatePurchaseDialog
            binding={binding}
            siteId={siteId}
            onSuccess={(purchase) => {
              close();
              openPurchase(purchase);
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
