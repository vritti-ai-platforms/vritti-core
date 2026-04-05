import type { TreeDataItem } from '@vritti/quantum-ui/TreeView';
import type { CategoryData } from '@/schemas/categories';

// Recursively converts a flat category list to a nested TreeDataItem tree, sorted by sortOrder
export function toTreeItems(flat: CategoryData[]): TreeDataItem[] {
  const childMap = new Map<string | null, CategoryData[]>();

  for (const c of flat) {
    const key = c.parentId ?? null;
    const siblings = childMap.get(key) ?? [];
    siblings.push(c);
    childMap.set(key, siblings);
  }

  function build(parentId: string | null): TreeDataItem[] {
    return (childMap.get(parentId) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => {
        const children = build(c.id);
        return {
          id: c.id,
          name: c.name,
          ...(children.length > 0 ? { children } : {}),
        } satisfies TreeDataItem;
      });
  }

  return build(null);
}

// Filters tree nodes to those matching the query or having a matching descendant
export function filterTree(nodes: TreeDataItem[], q: string): TreeDataItem[] {
  const lower = q.toLowerCase();
  return nodes.reduce<TreeDataItem[]>((acc, node) => {
    const childMatches = node.children ? filterTree(node.children, q) : [];
    const selfMatches = node.name.toLowerCase().includes(lower);

    if (selfMatches) {
      acc.push(node); // include node as-is with all its original children
    } else if (childMatches.length > 0) {
      acc.push({ ...node, children: childMatches }); // narrow children to matches only
    }

    return acc;
  }, []);
}
