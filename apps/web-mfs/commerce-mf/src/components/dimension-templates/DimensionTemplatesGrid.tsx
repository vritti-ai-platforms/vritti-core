import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Plus, SearchX, SwatchBook } from 'lucide-react';
import type React from 'react';
import type { DimensionTemplateData } from '@/schemas/dimension-templates';
import { DimensionTemplateCard } from './DimensionTemplateCard';
import type { DimensionTemplatesBinding } from './types';

interface DimensionTemplatesGridProps {
  binding: DimensionTemplatesBinding;
  // The scope's suspense query — this component is what suspends, so the boundary sits just above it
  search: string;
  isDeleting: boolean;
  isTogglingActive: boolean;
  onAdd: () => void;
  onDelete: (template: DimensionTemplateData) => void;
  onToggleActive: (template: DimensionTemplateData, isActive: boolean) => void;
}

export const DimensionTemplatesGrid: React.FC<DimensionTemplatesGridProps> = ({
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
        icon={<SwatchBook />}
        title="No dimension templates"
        description="Create one so offerings can seed their dimensions from a shared list."
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
        <DimensionTemplateCard
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
