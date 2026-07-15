import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { type TreeDataItem, type TreeReorderPayload, TreeView } from '@vritti/quantum-ui-native/TreeView';
import { useState } from 'react';
import { View } from 'react-native';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

const STATUS_META: Record<InvoiceStatus, { label: string }> = {
  paid: { label: 'Paid' },
  pending: { label: 'Pending' },
  overdue: { label: 'Overdue' },
  draft: { label: 'Draft' },
};

const STATUSES: InvoiceStatus[] = ['paid', 'pending', 'overdue', 'draft'];

function AmountBadge({ amount }: { amount: number }) {
  return (
    <View className="self-start rounded-full bg-muted px-2 py-0.5">
      <Text className="text-xs font-medium text-muted-foreground">${amount.toLocaleString()}</Text>
    </View>
  );
}

// 20-level-deep tree (stress-tests deep nesting: indent lines + open/close animation). Each status
// root drills down through nested groups to an invoice leaf at level 20. No icons passed — TreeView
// renders its built-in folder / open-folder (yellow) for groups and a file icon for leaves.
const MAX_DEPTH = 20;
let invoiceSeq = 0;

function buildBranch(status: InvoiceStatus, level: number, prefix: string): TreeDataItem {
  if (level >= MAX_DEPTH) {
    invoiceSeq += 1;
    const amount = 100 + invoiceSeq * 37;
    return {
      id: `${prefix}-inv`,
      name: `INV-${String(invoiceSeq).padStart(4, '0')}`,
      actions: <AmountBadge amount={amount} />,
      disabled: status === 'draft',
    };
  }
  // Branch 2-wide near the top, single-child deeper, so the tree is clearly 10 levels deep without
  // exploding into thousands of rows.
  const childCount = level <= 2 ? 2 : 1;
  return {
    id: prefix,
    name: level === 1 ? STATUS_META[status].label : `Level ${level}`,
    children: Array.from({ length: childCount }).map((_, i) => buildBranch(status, level + 1, `${prefix}-${i}`)),
  };
}

const TREE_DATA: TreeDataItem[] = STATUSES.map((status) => buildBranch(status, 1, `s-${status}`));

// Reorder a group's children to match `orderedIds`; recurse to find the matched parent (null = root).
function reorderChildren(children: TreeDataItem[], orderedIds: string[]): TreeDataItem[] {
  const byId = new Map(children.map((c) => [c.id, c]));
  return orderedIds.map((id) => byId.get(id)).filter((c): c is TreeDataItem => c !== undefined);
}
function applyReorder(nodes: TreeDataItem[], parentId: string | null, orderedIds: string[]): TreeDataItem[] {
  if (parentId === null) return reorderChildren(nodes, orderedIds);
  return nodes.map((n) => {
    if (n.id === parentId && n.children) return { ...n, children: reorderChildren(n.children, orderedIds) };
    if (n.children) return { ...n, children: applyReorder(n.children, parentId, orderedIds) };
    return n;
  });
}

export default function InvoicesScreen() {
  const [tree, setTree] = useState<TreeDataItem[]>(TREE_DATA);

  const handleReorder = ({ parentId, orderedIds }: TreeReorderPayload) => {
    setTree((prev) => applyReorder(prev, parentId, orderedIds));
    console.log('[invoices] tree reorder', parentId, orderedIds);
  };

  return (
    <ScreenContainer scrollable>
      <View className="gap-4 p-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Invoices</Text>
          <Text className="text-sm text-muted-foreground">20 levels deep — long-press a row to reorder its group.</Text>
        </View>
        <TreeView
          data={tree}
          draggable
          onReorder={handleReorder}
          initialSelectedItemId="s-paid"
          onSelectChange={(item) => console.log('[invoices] tree select', item?.id)}
        />
      </View>
    </ScreenContainer>
  );
}
