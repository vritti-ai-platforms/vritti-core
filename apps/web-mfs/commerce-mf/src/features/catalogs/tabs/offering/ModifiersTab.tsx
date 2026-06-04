import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ModifierGroupSelector } from '@vritti/quantum-ui/selects/modifier-group';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Plus, Sliders, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useOfferingModifiers, useSaveOfferingModifiers } from '@/hooks/offerings';
import {
  type AttachModifierFormData,
  attachModifierSchema,
  type OfferingDetail,
  type OfferingModifierGroup,
} from '@/schemas/offerings';

interface ModifiersTabProps {
  catalogId: string;
  offering: OfferingDetail;
}

export const ModifiersTab: React.FC<ModifiersTabProps> = ({ catalogId, offering }) => {
  const { data: assigned = [], isLoading } = useOfferingModifiers(catalogId, offering.id);
  const saveMutation = useSaveOfferingModifiers();
  const confirm = useConfirm();
  const addDialog = useDialog();

  const assignedIds = useMemo(() => assigned.map((g) => g.id), [assigned]);

  const handleRemove = useCallback(
    async (group: OfferingModifierGroup) => {
      const confirmed = await confirm({
        title: `Remove "${group.name}"?`,
        description: 'This modifier group will no longer apply to this offering.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) {
        saveMutation.mutate({
          catalogId,
          offeringId: offering.id,
          groupIds: assignedIds.filter((id) => id !== group.id),
        });
      }
    },
    [confirm, saveMutation, catalogId, offering.id, assignedIds],
  );

  const columns = useMemo<ColumnDef<OfferingModifierGroup>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'selectionType',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.selectionType === 'SINGLE' ? 'Single' : 'Multi'}</Badge>
        ),
      },
      {
        id: 'required',
        header: 'Required',
        cell: ({ row }) =>
          row.original.minSelections > 0 ? <Badge variant="secondary">Required</Badge> : <span>—</span>,
      },
      {
        id: 'options',
        header: 'Options',
        cell: ({ row }) => row.original.options.length,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                disabled: saveMutation.isPending,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [handleRemove, saveMutation.isPending],
  );

  const { table } = useDataTable({
    columns,
    slug: `offering-${offering.id}-modifiers`,
    label: 'modifier',
    serverState: { result: assigned },
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        toolbarActions={{
          actions: (
            <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Modifier
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Sliders,
          title: 'No modifiers',
          description: 'Attach a catalog modifier group (e.g. Toppings, Spice level) to this offering.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Modifier
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Modifier"
        description="Attach a catalog modifier group to this offering."
        content={(close) => (
          <AddModifierForm
            catalogId={catalogId}
            offeringId={offering.id}
            assignedIds={assignedIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};

interface AddModifierFormProps {
  catalogId: string;
  offeringId: string;
  assignedIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AddModifierForm: React.FC<AddModifierFormProps> = ({
  catalogId,
  offeringId,
  assignedIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AttachModifierFormData>({
    resolver: zodResolver(attachModifierSchema),
    defaultValues: { groupId: '' },
  });

  const saveMutation = useSaveOfferingModifiers({ onSuccess });

  return (
    <Form
      form={form}
      mutation={saveMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        catalogId,
        offeringId,
        groupIds: Array.from(new Set([...assignedIds, data.groupId])),
      })}
    >
      <ModifierGroupSelector name="groupId" catalogId={catalogId} />

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Modifier
        </Button>
      </div>
    </Form>
  );
};
