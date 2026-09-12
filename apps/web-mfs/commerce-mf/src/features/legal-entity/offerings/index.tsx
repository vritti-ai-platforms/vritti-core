import { LE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OfferingDetailSkeleton } from '@/components/offerings/OfferingDetailSkeleton';
import { VariantDetailSkeleton } from '@/components/offerings/VariantDetailSkeleton';
import { GenerateVariantsPage } from './GenerateVariantsPage';
import { OfferingDetailPage } from './OfferingDetailPage';
import { OfferingsPage } from './OfferingsPage';
import { VariantDetailPage } from './VariantDetailPage';

// The gate sits outside the boundary so a denied user never mounts the page and never fires the
// request — useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const gated = (permission: string, element: React.ReactNode, fallback = <OfferingDetailSkeleton />) => (
  <PermissionGate
    permission={permission}
    fallback={({ reason, title, tip }) => (
      <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
    )}
  >
    <Suspense fallback={fallback}>{element}</Suspense>
  </PermissionGate>
);

const routes: RouteObject[] = [
  { index: true, element: <OfferingsPage /> },
  // `:tab?` lets Tabs own the active tab in the URL — deep links and back/forward work
  { path: ':slug/:tab?', element: gated(LE_OFFERINGS.view, <OfferingDetailPage />) },
  // Three segments, so it never collides with the two-segment tab route above
  { path: ':slug/variants/generate', element: gated(LE_OFFERINGS.variants.add, <GenerateVariantsPage />) },
  // Ranks below the static `generate` above — React Router prefers a literal segment over a param
  {
    path: ':slug/variants/:variantSlug/:tab?',
    element: gated(LE_OFFERINGS.variants.view, <VariantDetailPage />, <VariantDetailSkeleton />),
  },
];

export default routes;
