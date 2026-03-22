import { parseSlug } from '@vritti/quantum-ui/utils/slug';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Reads BU ID from the URL path — works across MF boundary
export function useCommerceContext() {
  const { pathname } = useLocation();

  const businessUnitId = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const buSegment = segments.find((s) => s.startsWith('bu-'));
    if (!buSegment) return '';
    const parsed = parseSlug(buSegment.replace(/^bu-/, ''));
    return parsed?.id ?? '';
  }, [pathname]);

  return { businessUnitId };
}
