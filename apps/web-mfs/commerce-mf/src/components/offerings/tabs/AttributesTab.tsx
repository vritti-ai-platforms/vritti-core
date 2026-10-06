import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SortableItem, SortableList } from '@vritti/quantum-ui/Sortable';
import { Plus, Tags } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import type { OfferingAttributeData, OfferingData } from '@/schemas/offerings';
import { AttributeCard } from '../components/AttributeCard';
import { AttributesSkeleton } from '../components/AttributesSkeleton';
import { AddAttributeDialog } from '../forms/AddAttributeDialog';
import { AddAttributeFromTemplateDialog } from '../forms/AddAttributeFromTemplateDialog';
import type {
  OfferingPermissions,
  UseCreateAttribute,
  UseCreateAttributeFromTemplate,
  UseDeleteAttribute,
  UseOfferingAttributes,
  UseReorderAttributes,
  UseUpdateAttribute,
  UseUpsertAttributeValues,
} from '../types';

interface AttributesTabProps {
  useAttributes: UseOfferingAttributes;
  useCreate: UseCreateAttribute;
  useCreateFromTemplate: UseCreateAttributeFromTemplate;
  useUpsertValues: UseUpsertAttributeValues;
  useUpdate: UseUpdateAttribute;
  useReorder: UseReorderAttributes;
  useDelete: UseDeleteAttribute;
  permissions: OfferingPermissions;
  offering: OfferingData;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({
  permissions,
  offering,
  useAttributes,
  useCreate,
  useCreateFromTemplate,
  useUpsertValues,
  useUpdate,
  useReorder,
  useDelete,
}) => {
  const confirm = useConfirm();
  const addDialog = useDialog();
  const fromTemplateDialog = useDialog();
  const { data: attributes = [], isLoading } = useAttributes(offering.id);
  const reorderMutation = useReorder();
  const deleteMutation = useDelete();

  const handleDelete = useCallback(
    async (attribute: OfferingAttributeData) => {
      const confirmed = await confirm({
        title: `Delete "${attribute.name}"?`,
        description: 'The attribute and its values will be deleted from this offering.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(attribute.id);
    },
    [confirm, deleteMutation],
  );

  const addButtons = (
    <>
      <Button
        variant="outline"
        onClick={fromTemplateDialog.open}
        startAdornment={<Tags className="size-4" />}
        permission={permissions.attributes.addFromTemplate}
      >
        From Template
      </Button>
      <Button
        onClick={addDialog.open}
        startAdornment={<Plus className="size-4" />}
        permission={permissions.attributes.add}
      >
        Add Attribute
      </Button>
    </>
  );

  const dialogs = (
    <>
      <Dialog
        handle={fromTemplateDialog}
        icon={Tags}
        title="Add Attribute from Template"
        description="Values are copied onto this offering, so editing the template later will not reshape it."
        content={(close) => (
          <AddAttributeFromTemplateDialog
            offeringId={offering.id}
            useCreate={useCreateFromTemplate}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
      <Dialog
        handle={addDialog}
        icon={Tags}
        title="Add Attribute"
        description="Created empty — add its values from the card afterwards."
        content={(close) => (
          <AddAttributeDialog offeringId={offering.id} useCreate={useCreate} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );

  const header = (
    <div className="flex items-start justify-between gap-4">
      <p className="max-w-xl text-muted-foreground text-sm">
        Facts about this product that are not part of its SKU — High Protein, High Fibre. A variant carries any number
        of them, and a storefront turns them into filters.
      </p>
      <div className="flex flex-none gap-2">{addButtons}</div>
    </div>
  );

  // An empty array reads the same whether the attributes are loading or genuinely absent, so the loading
  // branch has to come first or the empty state flashes on every visit
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <AttributesSkeleton />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          icon={<Tags />}
          title="No attributes yet"
          description="Add a claim such as Dietary or Certification, then pick its values on each variant."
          action={<div className="flex gap-2">{addButtons}</div>}
        />
        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      <SortableList
        items={attributes}
        onReorder={(next) =>
          reorderMutation.mutate({ offeringId: offering.id, attributeIds: next.map((item) => item.id) })
        }
        className="flex flex-col gap-3"
      >
        {attributes.map((attribute) => (
          <SortableItem key={attribute.id} id={attribute.id}>
            <AttributeCard
              attribute={attribute}
              canEdit={offering.canEdit}
              permissions={permissions}
              useUpsertValues={useUpsertValues}
              useUpdate={useUpdate}
              onDelete={handleDelete}
            />
          </SortableItem>
        ))}
      </SortableList>

      {dialogs}
    </div>
  );
};
