import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateTimeCell,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Coins, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useDeleteGoodsReceiptCost,
  useGoodsReceiptCosts,
} from '@/hooks/goods-receipts';
import type { CostRowData } from '@/schemas/inventory-item-costs';
import { AddCostDialog } from '../forms/AddCostDialog';
import { CostAllocationsPanel } from '../components/CostAllocationsPanel';

const KIND_ORDER: CostRowData['categoryKind'][] = ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'];
const KIND_LABELS: Record<CostRowData['categoryKind'], string> = {
  ITEM: 'Item',
  FREIGHT: 'Freight',
  DUTY: 'Duty',
  INSURANCE: 'Insurance',
  SERVICE: 'Service',
  OTHER: 'Other',
};

interface CostsTabProps {
  goodsReceiptId: string;
  isDraft: boolean;
}

export const CostsTab = ({ goodsReceiptId, isDraft }: CostsTabProps) => {
  const { data, isLoading } = useGoodsReceiptCosts(goodsReceiptId, { enabled: !isDraft });
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteGoodsReceiptCost(goodsReceiptId);
  const fmt = useFormatters();

  const columns = useMemo<ColumnDef<CostRowData>[]>(
    () => [
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StringCell value={row.original.categoryName} />
            <Badge variant="outline" className="text-xs">
              {KIND_LABELS[row.original.categoryKind] ?? row.original.categoryKind}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => <CurrencyCell value={row.original.totalAmount} />,
      },
      {
        accessorKey: 'distributionMethod',
        header: 'Distribution',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.distributionMethod.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'vendorRef',
        header: 'Vendor / Invoice',
        cell: ({ row }) =>
          row.original.vendorRef ? <StringCell value={row.original.vendorRef} mono /> : '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [];
          actions.push({
            id: 'allocations',
            icon: Eye,
            label: 'View Allocations',
            dialog: {
              title: 'Cost Allocations',
              description: `Per-quant breakdown of "${r.categoryName}" — ${fmt.currency(r.totalAmount).primary} spread by ${r.distributionMethod.replace('_', ' ')}.`,
              className: 'max-w-3xl',
              content: () => <CostAllocationsPanel goodsReceiptId={goodsReceiptId} costId={r.id} />,
            },
          });
          if (!r.isLocked) {
            actions.push({
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              dialog: {
                title: 'Edit Cost',
                description: `Update the ${r.categoryName} cost. Category is immutable; delete and re-add to change it.`,
                className: 'max-w-xl',
                content: (close) => (
                  <AddCostDialog goodsReceiptId={goodsReceiptId} editing={r} onSuccess={close} onCancel={close} />
                ),
              },
            });
            actions.push({
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              onClick: async () => {
                const ok = await confirm({
                  title: `Delete "${r.categoryName}" cost?`,
                  description: `${fmt.currency(r.totalAmount).primary} will be removed from inventory cost. Each affected quant's denormalized total_unit_cost will be recomputed.`,
                  confirmLabel: 'Delete',
                  variant: 'destructive',
                });
                if (ok) deleteMutation.mutate(r.id);
              },
            });
          }
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [confirm, deleteMutation, fmt, goodsReceiptId],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-gr-${goodsReceiptId}-costs`,
    label: 'cost',
    serverState: data?.costRows,
    enableRowSelection: false,
    enableSorting: false,
    enableMultiSort: false,
  });

  if (isDraft) {
    return (
      <div className="flex items-center justify-center py-12">
        <Empty
          icon={<Coins />}
          title="Publish to view costs"
          description="Costs are auto-calculated at publish and can then be edited or extended here."
        />
      </div>
    );
  }

  const total = data?.totalAmount;
  const perUnit = data?.perUnitCost;
  const kindBreakdown = data?.kindBreakdown ?? [];
  const populatedKinds = kindBreakdown.filter((k) => BigInt(k.amount.value || '0') !== 0n);
  const showAutoAssociateWarning = !isLoading && data?.costAssociatedAt == null;

  return (
    <div className="flex flex-col gap-4">
      {showAutoAssociateWarning && (
        <Alert
          variant="warning"
          icon={<Coins className="size-4" />}
          title="Supplier price not auto-captured"
          description="Either this GR has no PO link, or no cost category with kind=ITEM is configured for your org. Post costs manually via Add Cost, or visit Settings → Cost Categories to create one."
        />
      )}

      <div className="flex flex-col gap-2 rounded-md border bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-2xl font-semibold">{total ? fmt.currency(total).primary : '—'}</div>
            <div className="text-sm text-muted-foreground">
              {perUnit ? `${fmt.currency(perUnit).primary} per unit` : 'No costs yet'}
              {data?.costAssociatedAt && (
                <>
                  {' · '}
                  Last updated <DateTimeCell value={data.costAssociatedAt} />
                </>
              )}
            </div>
          </div>
          <Button size="sm" onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Cost
          </Button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {KIND_ORDER.map((kind) => {
            const entry = populatedKinds.find((k) => k.kind === kind);
            if (!entry) return null;
            return (
              <span key={kind} className="text-muted-foreground">
                <span className="font-medium text-foreground">{KIND_LABELS[kind]}</span>{' '}
                {fmt.currency(entry.amount).primary} ({entry.percentage.toFixed(1)}%)
              </span>
            );
          })}
          {populatedKinds.length === 0 && (
            <span className="text-muted-foreground">No costs associated yet.</span>
          )}
        </div>
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: Coins,
          title: 'No costs recorded',
          description: 'Add freight, customs, insurance, or any supplier-side charge to attribute it to this receipt.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Cost
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Cost"
        description="Distribute a supplier or logistics charge across this GR's inventory."
        className="max-w-xl"
        content={(close) => <AddCostDialog goodsReceiptId={goodsReceiptId} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
