import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SearchBar } from '@vritti/quantum-ui/SearchBar';
import { Plus, Tags } from 'lucide-react';
import type React from 'react';
import { Suspense, useCallback, useState } from 'react';
import type { AttributeTemplateData } from '@/schemas/attribute-templates';
import { AttributeTemplateGridSkeleton } from './AttributeTemplateGridSkeleton';
import { AttributeTemplatesGrid } from './AttributeTemplatesGrid';
import { AddAttributeTemplateDialog } from './forms/AddAttributeTemplateDialog';
import type { AttributeTemplatesBinding } from './types';

interface AttributeTemplatesPageProps {
  binding: AttributeTemplatesBinding;
}

export const AttributeTemplatesPage: React.FC<AttributeTemplatesPageProps> = ({ binding }) => {
  const [search, setSearch] = useState('');
  const deleteMutation = binding.useDelete();
  const setActiveMutation = binding.useSetActive();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (template: AttributeTemplateData) => {
      const confirmed = await confirm({
        title: `Delete "${template.name}"?`,
        description: 'This template will be permanently removed. Attributes already seeded from it keep their values.',
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
        title="Attribute Templates"
        description="Reusable claim sets seeded onto an offering when you add an attribute"
        actions={
          <Button
            onClick={addDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={binding.permissions.add}
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
      <Suspense fallback={<AttributeTemplateGridSkeleton />}>
        <AttributeTemplatesGrid
          binding={binding}
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
        icon={Tags}
        title="Add Attribute Template"
        description="Name the template first, then add its values. It can be activated once it has at least one."
        content={(close) => (
          <AddAttributeTemplateDialog
            useCreateAttributeTemplate={binding.useCreate}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
