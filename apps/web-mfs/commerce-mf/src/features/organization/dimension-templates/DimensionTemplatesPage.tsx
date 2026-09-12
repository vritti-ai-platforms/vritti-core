import { ORG_OFFERING_DIMENSION_TEMPLATES } from '@vritti/commerce-permissions/offering-dimension-templates';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Plus, SwatchBook } from 'lucide-react';
import { Suspense, useCallback, useState } from 'react';
import { DimensionTemplateGridSkeleton } from '@/components/dimension-templates/DimensionTemplateGridSkeleton';
import { DimensionTemplatesGrid } from '@/components/dimension-templates/DimensionTemplatesGrid';
import { AddDimensionTemplateDialog } from '@/components/dimension-templates/forms/AddDimensionTemplateDialog';
import { useDeleteDimensionTemplate, useSetDimensionTemplateActive } from '@/hooks/organization/dimension-templates';
import type { DimensionTemplateData } from '@/schemas/dimension-templates';

export const DimensionTemplatesPage = () => {
  const [search, setSearch] = useState('');
  const deleteMutation = useDeleteDimensionTemplate();
  const setActiveMutation = useSetDimensionTemplateActive();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (template: DimensionTemplateData) => {
      const confirmed = await confirm({
        title: `Delete "${template.name}"?`,
        description: 'This template will be permanently removed. Dimensions already seeded from it keep their values.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(template.id);
    },
    [confirm, deleteMutation],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title="Dimension Templates"
        description="Reusable option sets seeded onto an offering when you add a dimension"
        actions={
          <Button
            onClick={addDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={ORG_OFFERING_DIMENSION_TEMPLATES.add}
          >
            Add Template
          </Button>
        }
      />

      <SearchBar
        defaultValue={search}
        onDebouncedChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Search templates by name or description"
        clearable
        className="max-w-sm"
      />

      {/* The boundary sits here rather than at the route, so only the grid area drops to the
          skeleton — the header and search bar stay put on first load and on every search. */}
      <Suspense fallback={<DimensionTemplateGridSkeleton />}>
        <DimensionTemplatesGrid
          permissions={ORG_OFFERING_DIMENSION_TEMPLATES}
          search={search}
          isDeleting={deleteMutation.isPending}
          isTogglingActive={setActiveMutation.isPending}
          onAdd={addDialog.open}
          onDelete={handleDelete}
          onToggleActive={(item, isActive) => setActiveMutation.mutate({ id: item.id, isActive })}
        />
      </Suspense>

      <Dialog
        handle={addDialog}
        icon={SwatchBook}
        title="Add Dimension Template"
        description="Name the template first, then add its values. It can be activated once it has at least one."
        content={(close) => <AddDimensionTemplateDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
