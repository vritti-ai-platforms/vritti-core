import { SITE_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/dimension-templates';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type { RouteObject } from 'react-router-dom';
import { DimensionTemplatesPage } from '@/components/dimension-templates/DimensionTemplatesPage';
import type { DimensionTemplatesBinding } from '@/components/dimension-templates/types';
import {
  useCreateDimensionTemplate,
  useDeleteDimensionTemplate,
  useDimensionTemplates,
  useSetDimensionTemplateActive,
  useUpdateDimensionTemplate,
  useUpsertDimensionTemplateValues,
} from '@/hooks/site/dimension-templates';

const binding: DimensionTemplatesBinding = {
  permissions: SITE_DIMENSION_TEMPLATES,
  useTemplates: useDimensionTemplates,
  useCreate: useCreateDimensionTemplate,
  useUpdate: useUpdateDimensionTemplate,
  useUpsertValues: useUpsertDimensionTemplateValues,
  useDelete: useDeleteDimensionTemplate,
  useSetActive: useSetDimensionTemplateActive,
};

// The gate sits above the page so a denied user never mounts it and never fires the request —
// useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <PermissionGate
        permission={SITE_DIMENSION_TEMPLATES.view}
        fallback={({ reason, title, tip }) => (
          <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
        )}
      >
        <DimensionTemplatesPage binding={binding} />
      </PermissionGate>
    ),
  },
];

export default routes;
