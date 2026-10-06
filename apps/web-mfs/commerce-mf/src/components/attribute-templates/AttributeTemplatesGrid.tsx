import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Plus, SearchX, Tags } from 'lucide-react';
import type React from 'react';
import type { AttributeTemplateData } from '@/schemas/attribute-templates';
import { AttributeTemplateCard } from './AttributeTemplateCard';
import type { AttributeTemplatesBinding } from './types';

interface AttributeTemplatesGridProps {
  binding: AttributeTemplatesBinding;
  // The scope's suspense query — this component is what suspends, so the boundary sits just above it
  search: string;
  isDeleting: boolean;
  isTogglingActive: boolean;
  onAdd: () => void;
  onDelete: (template: AttributeTemplateData) => void;
  onToggleActive: (template: AttributeTemplateData, isActive: boolean) => void;
}

export const AttributeTemplatesGrid: React.FC<AttributeTemplatesGridProps> = ({
  binding,
  search,
  isDeleting,
  isTogglingActive,
  onAdd,
  onDelete,
  onToggleActive,
}) => {
  const { data: templates } = binding.useTemplates(search || undefined);

  if (templates.length === 0) {
    return search ? (
      <Empty
        className="flex-1"
        icon={<SearchX />}
        title="No matching templates"
        description={`Nothing matches "${search}". Clear the search to see all templates.`}
      />
    ) : (
      <Empty
        className="flex-1"
        icon={<Tags />}
        title="No attribute templates"
        description="Create one so offerings can seed their attributes from a shared list."
        action={
          <Button onClick={onAdd} startAdornment={<Plus className="size-4" />} permission={binding.permissions.add}>
            Add Template
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <AttributeTemplateCard
          binding={binding}
          key={template.id}
          template={template}
          isDeleting={isDeleting}
          isTogglingActive={isTogglingActive}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
};
