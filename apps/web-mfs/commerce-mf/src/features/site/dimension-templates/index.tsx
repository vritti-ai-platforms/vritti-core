import { SITE_OFFERING_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/offering-dimension-templates';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type { RouteObject } from 'react-router-dom';
import { DimensionTemplatesPage } from './DimensionTemplatesPage';

// The gate sits above the page so a denied user never mounts it and never fires the request —
// useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <PermissionGate
        permission={SITE_OFFERING_DIMENSION_TEMPLATES.view}
        fallback={({ reason, title, tip }) => (
          <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
        )}
      >
        <DimensionTemplatesPage />
      </PermissionGate>
    ),
  },
];

export default routes;
