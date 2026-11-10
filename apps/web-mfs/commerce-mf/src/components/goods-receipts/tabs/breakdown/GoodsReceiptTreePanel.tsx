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
import type React from 'react';
import type { GoodsReceiptData, GoodsReceiptTreeNode } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { AddPurchaseOrderDialog } from './forms/AddPurchaseOrderDialog';

interface GoodsReceiptTreePanelProps {
  binding: GoodsReceiptsBinding;
  receipt: GoodsReceiptData;
  isDraft: boolean;
  selection: TreeSelection | null;
  onSelect: (selection: TreeSelection | null) => void;
}

interface TreeNodeData extends TreeDataItem {
  kind: 'item' | 'lot' | 'line';
  balanced: boolean;
  badge: string;
}

// Maps the receipt's tree to TreeView nodes, keeping each node's kind and balance
function toTreeData(nodes: GoodsReceiptTreeNode[]): TreeNodeData[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    kind: node.kind,
    balanced: node.balanced,
    badge: node.badge,
    children: node.children?.length ? toTreeData(node.children) : undefined,
  }));
}

// One tree row: the node's kind icon, name and balance badge
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
      <Badge variant={node.balanced ? 'success' : 'warning'} className="shrink-0">
        {node.badge}
      </Badge>
      {/* Leaf rows have no expand chevron — reserve its width so the badge column aligns with parent rows. */}
      {isLeaf && <span aria-hidden className="h-4 w-4 shrink-0" />}
    </div>
  );
};

// Maps every lot to its item and every line to its item and lot, to rebuild a selection from a clicked node
function buildParentMap(nodes: GoodsReceiptTreeNode[]) {
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
        itemAndLotOfLine.set(child.id, { itemId: item.id, lotId: null });
      }
    }
  }
  return { itemOfLot, itemAndLotOfLine };
}

// The tree node id of the active selection
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

// The receipt's items with their lots and lines; a draft that created its own inbound delivery adds another purchase
// order's open lines
export const GoodsReceiptTreePanel: React.FC<GoodsReceiptTreePanelProps> = ({
  binding,
  receipt,
  isDraft,
  selection,
  onSelect,
}) => {
  const { data: tree = [], isLoading } = binding.useTree(receipt.id);
  const addPurchaseOrderDialog = useDialog();
  const takesPurchaseOrders = isDraft && receipt.deliverySource === 'RECEIPT';

  const treeData = toTreeData(tree);
  const { itemOfLot, itemAndLotOfLine } = buildParentMap(tree);
  const selectedId = selectionNodeId(selection);

  // Rebuilds the selection of a clicked node from its kind and parents
  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (!item) return onSelect(null);
    const node = item as TreeNodeData;
    if (node.kind === 'item') return onSelect({ kind: 'item', itemId: node.id });
    if (node.kind === 'lot') {
      const itemId = itemOfLot.get(node.id);
      return onSelect(itemId ? { kind: 'lot', itemId, lotId: node.id } : null);
    }
    const parents = itemAndLotOfLine.get(node.id);
    onSelect(parents ? { kind: 'line', itemId: parents.itemId, lotId: parents.lotId, lineId: node.id } : null);
  };

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
          takesPurchaseOrders && (
            <Button
              size="sm"
              permission={binding.permissions.edit}
              startAdornment={<Plus className="size-3.5" />}
              onClick={addPurchaseOrderDialog.open}
            >
              Add Purchase Order
            </Button>
          )
        }
        isLoading={isLoading}
        isEmpty={tree.length === 0}
        emptyState={
          <Empty
            icon={<Package />}
            title="No items"
            description={isDraft ? 'Every line was removed from this draft.' : 'No items on this receipt.'}
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
          onSelectChange={handleSelectChange}
          renderItem={(params) => <TreeRow {...params} />}
          defaultNodeIcon={Package}
          defaultLeafIcon={MapPin}
        />
      </PageContentPanel>

      {takesPurchaseOrders && (
        <AddPurchaseOrderDialog binding={binding} receipt={receipt} handle={addPurchaseOrderDialog} />
      )}
    </>
  );
};
