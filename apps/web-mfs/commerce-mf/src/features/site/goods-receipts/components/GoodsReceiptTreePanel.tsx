import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type { TreeDataItem, TreeRenderItemParams } from '@vritti/quantum-ui/TreeView';
import { TreeView } from '@vritti/quantum-ui/TreeView';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Boxes, MapPin, Package, Plus } from 'lucide-react';
import type { GoodsReceiptTreeNode } from '@/schemas/goods-receipts';
import { useGoodsReceiptTree } from '@/hooks/site/goods-receipts';
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
  supplierCurrencyCode: string;
  selection: TreeSelection | null;
  onSelect: (selection: TreeSelection | null) => void;
}

interface TreeNodeData extends TreeDataItem {
  kind: 'item' | 'lot' | 'line';
  balanced: boolean;
  badge: string;
}

const toTreeData = (nodes: GoodsReceiptTreeNode[]): TreeNodeData[] =>
  nodes.map((n) => ({
    id: n.id,
    name: n.name,
    kind: n.kind,
    balanced: n.balanced,
    badge: n.badge,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));

const TreeRow = ({ item, isLeaf }: TreeRenderItemParams) => {
  const node = item as TreeNodeData;
  const Icon = node.kind === 'item' ? Package : node.kind === 'lot' ? Boxes : MapPin;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Typography variant="body2" className="flex-1 truncate">
        {node.name}
      </Typography>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
        {node.kind}
      </span>
      <Badge
        variant="secondary"
        className={`shrink-0 text-xs rounded-full px-1.5 py-0.5 leading-none ${
          node.balanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
        }`}
      >
        {node.badge}
      </Badge>
      {/* Leaf rows have no expand chevron — reserve its width so the badge column aligns with parent rows. */}
      {isLeaf && <span aria-hidden className="h-4 w-4 shrink-0" />}
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

// The selected tree node id is the leaf id of the active selection.
function selectionNodeId(selection: TreeSelection | null): string | undefined {
  switch (selection?.kind) {
    case 'item':
      return selection.itemId;
    case 'lot':
      return selection.lotId;
    case 'line':
      return selection.lineId;
    default:
      return undefined;
  }
}

export const GoodsReceiptTreePanel = ({
  goodsReceiptId,
  isDraft,
  poId,
  supplierId,
  supplierCurrencyCode,
  selection,
  onSelect,
}: GoodsReceiptTreePanelProps) => {
  const { data: tree = [], isLoading } = useGoodsReceiptTree(goodsReceiptId);
  const addItemDialog = useDialog();

  const treeData = toTreeData(tree);
  const { itemOfLot, itemAndLotOfLine } = buildParentMap(tree);

  const selectedId = selectionNodeId(selection);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Items</div>
            <div className="text-xs text-muted-foreground">{pluralize('item', tree.length, true)}</div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addItemDialog.open}>
              Add Item
            </Button>
          ) : null
        }
        isEmpty={!isLoading && tree.length === 0}
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
          isLoading={isLoading}
          initialSelectedItemId={selectedId}
          selectedItemId={selectedId ?? null}
          defaultDraggable={false}
          defaultDroppable={false}
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
        supplierId={supplierId}
        supplierCurrencyCode={supplierCurrencyCode}
        poId={poId}
        handle={addItemDialog}
      />
    </>
  );
};
