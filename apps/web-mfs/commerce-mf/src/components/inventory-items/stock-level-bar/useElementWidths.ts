import { isEqual } from '@vritti/quantum-ui/lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Tracks the rendered width of every element given `measure` as its ref, keyed by the element's `data-measure`
export function useElementWidths() {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const observer = useMemo(
    () =>
      new ResizeObserver((entries) =>
        setWidths((current) => {
          const next = { ...current };
          for (const entry of entries) {
            const key = (entry.target as HTMLElement).dataset.measure;
            if (key) next[key] = entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width;
          }
          return isEqual(current, next) ? current : next;
        }),
      ),
    [],
  );
  useEffect(() => () => observer.disconnect(), [observer]);

  const measure = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      observer.observe(node);
      return () => observer.unobserve(node);
    },
    [observer],
  );

  return { widths, measure };
}
