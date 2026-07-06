import {
  type ASTVisitor,
  type FragmentDefinitionNode,
  GraphQLError,
  type InlineFragmentNode,
  type OperationDefinitionNode,
  type SelectionSetNode,
  type ValidationContext,
} from "graphql";

// Rejects operations whose selection nesting exceeds `maxDepth` — defense-in-depth against abusive,
// deeply-nested queries (complements the keyset page-size clamp, which bounds breadth). Fragment spreads
// are resolved so a deep query can't hide behind fragments; a cycle guard prevents infinite recursion on
// recursive fragments (which a separate rule rejects anyway). Runs at validation time, before execution.
export function depthLimit(maxDepth: number): (context: ValidationContext) => ASTVisitor {
  return (context: ValidationContext): ASTVisitor => {
    const fragments: Record<string, FragmentDefinitionNode> = {};
    for (const def of context.getDocument().definitions) {
      if (def.kind === "FragmentDefinition") fragments[def.name.value] = def;
    }

    const depthOf = (
      node: { selectionSet?: SelectionSetNode },
      seenFragments: ReadonlySet<string>,
    ): number => {
      let max = 0;
      for (const selection of node.selectionSet?.selections ?? []) {
        if (selection.kind === "Field") {
          const childDepth = selection.selectionSet ? 1 + depthOf(selection, seenFragments) : 1;
          if (childDepth > max) max = childDepth;
        } else if (selection.kind === "InlineFragment") {
          const childDepth = depthOf(selection as InlineFragmentNode, seenFragments);
          if (childDepth > max) max = childDepth;
        } else {
          // FragmentSpread — resolve its definition once (cycle-guarded).
          const name = selection.name.value;
          if (seenFragments.has(name)) continue;
          const fragment = fragments[name];
          if (fragment) {
            const childDepth = depthOf(fragment, new Set(seenFragments).add(name));
            if (childDepth > max) max = childDepth;
          }
        }
      }
      return max;
    };

    return {
      OperationDefinition(operation: OperationDefinitionNode) {
        const depth = depthOf(operation, new Set<string>());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(`Query is too deeply nested (max depth ${maxDepth}).`, { nodes: [operation] }),
          );
        }
      },
    };
  };
}
