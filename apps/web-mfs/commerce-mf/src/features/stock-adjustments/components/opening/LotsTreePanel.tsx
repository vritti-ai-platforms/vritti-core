import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Boxes, MapPin, Plus } from 'lucide-react';
import { useStockAdjustmentTree } from '@/hooks/stock-adjustments';
import type { StockAdjustmentTreeNode } from '@/schemas/stock-adjustments';
import { AddLotDialog } from '../../forms/opening/AddLotDialog';

interface LotsTreePanelProps {
  adjustmentId: string;
  isDraft: boolean;
  uomSymbol: string;
  selectedId: string | null;
  onSelect: (selection: { kind: 'lot' | 'line'; lotId: string; lineId: string | null } | null) => void;
}

interface LotsTreeNodeData extends TreeDataItem {
  kind: 'lot' | 'line';
  isBalanced: boolean;
  totalQuantity?: number;
  linesCount?: number;
  quantity?: number;
  lineItemsCount?: number;
}

const toTreeData = (nodes: StockAdjustmentTreeNode[]): LotsTreeNodeData[] =>
  nodes.map((n) => ({
    id: n.id,
    name: n.name,
    kind: n.kind,
    isBalanced: n.isBalanced,
    totalQuantity: n.totalQuantity,
    linesCount: n.linesCount,
    quantity: n.quantity,
    lineItemsCount: n.lineItemsCount,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));

const TreeRow = ({ uomSymbol }: { uomSymbol: string }) =>
  function LotsRow({ item }: TreeRenderItemParams) {
    const node = item as LotsTreeNodeData;
    const Icon = node.kind === 'lot' ? Boxes : MapPin;
    const badgeText =
      node.kind === 'lot'
        ? `${node.totalQuantity ?? 0} ${uomSymbol}`
        : `${node.lineItemsCount ?? 0}/${node.quantity ?? 0}`;
    const balanced = node.isBalanced;
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Typography variant="body2" className="truncate">
          {node.name}
        </Typography>
        <Badge
          variant="secondary"
          className={`ml-auto text-[10px] rounded-full px-1.5 py-0.5 leading-none ${
            balanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
          }`}
        >
          {badgeText}
        </Badge>
      </div>
    );
  };

export const LotsTreePanel = ({ adjustmentId, isDraft, uomSymbol, selectedId, onSelect }: LotsTreePanelProps) => {
  const { data: tree = [], isFetching } = useStockAdjustmentTree(adjustmentId);
  const addLotDialog = useDialog();

  const treeData = toTreeData(tree);
  const renderItem = TreeRow({ uomSymbol });

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Lots</div>
            <div className="text-xs text-muted-foreground">{pluralize('lot', tree.length, true)}</div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLotDialog.open}>
              Add Lot
            </Button>
          ) : null
        }
        isEmpty={!isFetching && tree.length === 0}
        emptyState={
          <Empty
            icon={<Boxes />}
            title="No lots"
            description={isDraft ? 'Add the first lot to begin distributing.' : 'No lots in this adjustment.'}
          />
        }
      >
        <TreeView
          data={treeData}
          isLoading={isFetching}
          initialSelectedItemId={selectedId ?? undefined}
          onSelectChange={(item) => {
            if (!item) return onSelect(null);
            const node = item as LotsTreeNodeData;
            if (node.kind === 'lot') return onSelect({ kind: 'lot', lotId: node.id, lineId: null });
            // line: parent lot lookup via the source tree
            const parent = tree.find((lot) => lot.children?.some((line) => line.id === node.id));
            if (!parent) return onSelect(null);
            onSelect({ kind: 'line', lotId: parent.id, lineId: node.id });
          }}
          renderItem={renderItem}
          defaultNodeIcon={Boxes}
          defaultLeafIcon={MapPin}
        />
      </PageContentPanel>

      <AddLotDialog adjustmentId={adjustmentId} handle={addLotDialog} />
    </>
  );
};
