import { LE_ATTRIBUTE_TEMPLATES } from '@vritti/commerce-permissions/attribute-templates';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type { RouteObject } from 'react-router-dom';
import { AttributeTemplatesPage } from '@/components/attribute-templates/AttributeTemplatesPage';
import type { AttributeTemplatesBinding } from '@/components/attribute-templates/types';
import {
  useAttributeTemplates,
  useCreateAttributeTemplate,
  useDeleteAttributeTemplate,
  useSetAttributeTemplateActive,
  useUpdateAttributeTemplate,
  useUpsertAttributeTemplateValues,
} from '@/hooks/legal-entity/attribute-templates';

const binding: AttributeTemplatesBinding = {
  permissions: LE_ATTRIBUTE_TEMPLATES,
  useTemplates: useAttributeTemplates,
  useCreate: useCreateAttributeTemplate,
  useUpdate: useUpdateAttributeTemplate,
  useUpsertValues: useUpsertAttributeTemplateValues,
  useDelete: useDeleteAttributeTemplate,
  useSetActive: useSetAttributeTemplateActive,
};

// The gate sits above the page so a denied user never mounts it and never fires the request —
// useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <PermissionGate
        permission={LE_ATTRIBUTE_TEMPLATES.view}
        fallback={({ reason, title, tip }) => (
          <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
        )}
      >
        <AttributeTemplatesPage binding={binding} />
      </PermissionGate>
    ),
  },
];

export default routes;
