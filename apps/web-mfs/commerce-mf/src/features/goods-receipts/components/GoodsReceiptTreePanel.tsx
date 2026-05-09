import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Boxes, MapPin, Package, Plus } from 'lucide-react';
import { useGoodsReceiptInventoryItemIds, useGoodsReceiptTree } from '@/hooks/goods-receipts';
import {
  type GoodsReceiptTreeNode,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { AddItemDialog } from '../forms/AddItemDialog';

export type TreeSelection =
  | { kind: 'item'; itemId: string }
  | { kind: 'lot'; itemId: string; lotId: string }
  | { kind: 'line'; itemId: string; lotId: string | null; lineId: string };

interface GoodsReceiptTreePanelProps {
  goodsReceiptId: string;
  isDraft: boolean;
  poId: string | null;
  supplierId: string;
  selection: TreeSelection | null;
  onSelect: (selection: TreeSelection | null) => void;
}

interface TreeNodeData extends TreeDataItem {
  kind: 'item' | 'lot' | 'line';
  inventoryItemTracking?: 'quantity' | 'lot' | 'lot_serial' | 'serial';
  uomSymbol?: string;
  acceptedQuantity?: number;
  poRemainingQuantity?: number | null;
  totalQuantity?: number;
  linesCount?: number;
  quantity?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
}

const toTreeData = (nodes: GoodsReceiptTreeNode[]): TreeNodeData[] =>
  nodes.map((n) => ({
    id: n.id,
    name: n.name,
    kind: n.kind,
    inventoryItemTracking: n.inventoryItemTracking,
    uomSymbol: n.inventoryItemUomSymbol,
    acceptedQuantity: n.acceptedQuantity,
    poRemainingQuantity: n.poRemainingQuantity,
    totalQuantity: n.totalQuantity,
    linesCount: n.linesCount,
    quantity: n.quantity,
    lineItemsCount: n.lineItemsCount,
    isBalanced: n.isBalanced,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));

const TreeRow = ({ item }: TreeRenderItemParams) => {
  const node = item as TreeNodeData;
  const Icon = node.kind === 'item' ? Package : node.kind === 'lot' ? Boxes : MapPin;

  let badgeText: string;
  if (node.kind === 'item') {
    const accepted = node.acceptedQuantity ?? 0;
    const symbol = node.uomSymbol ? ` ${node.uomSymbol}` : '';
    badgeText =
      node.poRemainingQuantity != null
        ? `${accepted}/${accepted + node.poRemainingQuantity}${symbol}`
        : `${accepted}${symbol}`;
  } else if (node.kind === 'lot') {
    badgeText = `${node.totalQuantity ?? 0}${node.uomSymbol ? ` ${node.uomSymbol}` : ''}`;
  } else {
    // line — only ever shown for serial-tracked items
    badgeText = `${node.lineItemsCount ?? 0}/${node.quantity ?? 0}`;
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Typography variant="body2" className="truncate">
        {node.name}
      </Typography>
      <Badge
        variant="secondary"
        className={`ml-auto text-[10px] rounded-full px-1.5 py-0.5 leading-none ${
          node.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
        }`}
      >
        {badgeText}
      </Badge>
    </div>
  );
};

// Builds a parent-of map so we can recover (itemId, lotId?) from a clicked node id.
const buildParentMap = (nodes: GoodsReceiptTreeNode[]) => {
  const itemOfLot = new Map<string, string>();
  const itemAndLotOfLine = new Map<string, { itemId: string; lotId: string | null }>();
  for (const item of nodes) {
    if (item.kind !== 'item') continue;
    for (const child of item.children ?? []) {
      if (child.kind === 'lot') {
        itemOfLot.set(child.id, item.id);
        for (const line of child.children ?? []) {
          if (line.kind !== 'line') continue;
          itemAndLotOfLine.set(line.id, { itemId: item.id, lotId: child.id });
        }
      } else if (child.kind === 'line') {
        // SERIAL items: lines hang directly off the item (no lot layer).
        itemAndLotOfLine.set(child.id, { itemId: item.id, lotId: null });
      }
    }
  }
  return { itemOfLot, itemAndLotOfLine };
};

export const GoodsReceiptTreePanel = ({
  goodsReceiptId,
  isDraft,
  poId,
  supplierId,
  selection,
  onSelect,
}: GoodsReceiptTreePanelProps) => {
  const { data: tree = [], isFetching } = useGoodsReceiptTree(goodsReceiptId);
  const { data: existingItemIds = [] } = useGoodsReceiptInventoryItemIds(goodsReceiptId);
  const addItemDialog = useDialog();

  const treeData = toTreeData(tree);
  const { itemOfLot, itemAndLotOfLine } = buildParentMap(tree);

  const selectedId =
    selection?.kind === 'item'
      ? selection.itemId
      : selection?.kind === 'lot'
        ? selection.lotId
        : selection?.kind === 'line'
          ? selection.lineId
          : undefined;

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Items</div>
            <div className="text-xs text-muted-foreground">
              {tree.length} {tree.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addItemDialog.open}>
              Add Item
            </Button>
          ) : null
        }
        isEmpty={!isFetching && tree.length === 0}
        emptyState={
          <Empty
            icon={<Package />}
            title="No items"
            description={isDraft ? 'Add the first item to begin receiving.' : 'No items on this receipt.'}
          />
        }
      >
        <TreeView
          data={treeData}
          isLoading={isFetching}
          initialSelectedItemId={selectedId}
          onSelectChange={(item) => {
            if (!item) return onSelect(null);
            const node = item as TreeNodeData;
            if (node.kind === 'item') return onSelect({ kind: 'item', itemId: node.id });
            if (node.kind === 'lot') {
              const itemId = itemOfLot.get(node.id);
              if (!itemId) return onSelect(null);
              return onSelect({ kind: 'lot', itemId, lotId: node.id });
            }
            // line
            const parents = itemAndLotOfLine.get(node.id);
            if (!parents) return onSelect(null);
            onSelect({ kind: 'line', itemId: parents.itemId, lotId: parents.lotId ?? null, lineId: node.id });
          }}
          renderItem={(params) => <TreeRow {...params} />}
          defaultNodeIcon={Package}
          defaultLeafIcon={MapPin}
        />
      </PageContentPanel>

      <AddItemDialog
        goodsReceiptId={goodsReceiptId}
        excludeIds={existingItemIds}
        poId={poId}
        supplierId={supplierId}
        handle={addItemDialog}
      />
    </>
  );
};

// Suppress unused — InventoryTrackingValues kept for future tracking-aware row decoration
void InventoryTrackingValues;
