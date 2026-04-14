import type { TreeDataItem } from '@vritti/quantum-ui/TreeView';
import type { StorageLocationData } from '@/schemas/storage-locations';

// Recursively converts a flat location list to a nested TreeDataItem tree, sorted by sortOrder.
export function toTreeItems(flat: StorageLocationData[]): TreeDataItem[] {
  const childMap = new Map<string | null, StorageLocationData[]>();

  for (const location of flat) {
    const key = location.parentId ?? null;
    const siblings = childMap.get(key) ?? [];
    siblings.push(location);
    childMap.set(key, siblings);
  }

  function build(parentId: string | null): TreeDataItem[] {
    return (childMap.get(parentId) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((location) => {
        const children = build(location.id);
        return {
          id: location.id,
          name: location.name,
          ...(children.length > 0 ? { children } : {}),
        } satisfies TreeDataItem;
      });
  }

  return build(null);
}

// Filters tree nodes to those matching the query or having a matching descendant.
export function filterTree(nodes: TreeDataItem[], q: string): TreeDataItem[] {
  const lower = q.toLowerCase();
  return nodes.reduce<TreeDataItem[]>((acc, node) => {
    const childMatches = node.children ? filterTree(node.children, q) : [];
    const selfMatches = node.name.toLowerCase().includes(lower);

    if (selfMatches) {
      acc.push(node);
    } else if (childMatches.length > 0) {
      acc.push({ ...node, children: childMatches });
    }

    return acc;
  }, []);
}
