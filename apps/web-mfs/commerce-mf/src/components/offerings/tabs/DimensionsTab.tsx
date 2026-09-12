import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SortableItem, SortableList } from '@vritti/quantum-ui/Sortable';
import { Plus, SwatchBook } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import type { OfferingData, OfferingDimensionData } from '@/schemas/offerings';
import { DimensionCard } from '../components/DimensionCard';
import { DimensionsSkeleton } from '../components/DimensionsSkeleton';
import { SkuOrderStrip } from '../components/SkuOrderStrip';
import { AddDimensionDialog } from '../forms/AddDimensionDialog';
import { AddDimensionFromTemplateDialog } from '../forms/AddDimensionFromTemplateDialog';
import type {
  OfferingPermissions,
  UseCreateDimension,
  UseCreateDimensionFromTemplate,
  UseDeleteDimension,
  UseOfferingDimensions,
  UseReorderDimensions,
  UseUpdateDimension,
  UseUpsertDimensionValues,
} from '../types';

interface DimensionsTabProps {
  useDimensions: UseOfferingDimensions;
  useCreate: UseCreateDimension;
  useCreateFromTemplate: UseCreateDimensionFromTemplate;
  useUpsertValues: UseUpsertDimensionValues;
  useUpdate: UseUpdateDimension;
  useReorder: UseReorderDimensions;
  useDelete: UseDeleteDimension;
  permissions: OfferingPermissions;
  offering: OfferingData;
}

export const DimensionsTab: React.FC<DimensionsTabProps> = ({
  permissions,
  offering,
  useDimensions,
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
  const { data: dimensions = [], isLoading } = useDimensions(offering.id);
  const reorderMutation = useReorder();
  const deleteMutation = useDelete();

  const handleDelete = useCallback(
    async (dimension: OfferingDimensionData) => {
      const confirmed = await confirm({
        title: `Delete "${dimension.name}"?`,
        description: 'The dimension and its values will be deleted from this offering.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(dimension.id);
    },
    [confirm, deleteMutation],
  );

  const addButtons = (
    <>
      <Button
        variant="outline"
        onClick={fromTemplateDialog.open}
        startAdornment={<SwatchBook className="size-4" />}
        permission={permissions.dimensions.addFromTemplate}
      >
        From Template
      </Button>
      <Button
        onClick={addDialog.open}
        startAdornment={<Plus className="size-4" />}
        permission={permissions.dimensions.add}
      >
        Add Dimension
      </Button>
    </>
  );

  const dialogs = (
    <>
      <Dialog
        handle={addDialog}
        icon={SwatchBook}
        title="Add Dimension"
        description="Created empty — add its values from the card afterwards."
        content={(close) => (
          <AddDimensionDialog offeringId={offering.id} useCreate={useCreate} onSuccess={close} onCancel={close} />
        )}
      />
      <Dialog
        handle={fromTemplateDialog}
        icon={SwatchBook}
        title="Add Dimension from Template"
        description="The template's code, name and values are copied onto this offering."
        content={(close) => (
          <AddDimensionFromTemplateDialog
            offeringId={offering.id}
            useCreate={useCreateFromTemplate}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );

  const header = (
    <div className="flex items-start justify-between gap-4">
      <p className="max-w-xl text-muted-foreground text-sm">
        The axes this product varies on. Values are copied when added, so editing a template later never reshapes
        variants that already exist.
      </p>
      <div className="flex flex-none gap-2">{addButtons}</div>
    </div>
  );

  // An empty array reads the same whether the axes are loading or genuinely absent, so the loading
  // branch has to come first or the empty state flashes on every visit
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <DimensionsSkeleton />
      </div>
    );
  }

  if (dimensions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          icon={<SwatchBook />}
          title="No dimensions yet"
          description="Add an axis such as Size or Colour, then generate variants from the combinations."
          action={<div className="flex gap-2">{addButtons}</div>}
        />
        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      <SkuOrderStrip offering={offering} dimensions={dimensions} />

      <SortableList
        items={dimensions}
        onReorder={(next) =>
          reorderMutation.mutate({ offeringId: offering.id, dimensionIds: next.map((item) => item.id) })
        }
        className="flex flex-col gap-3"
      >
        {dimensions.map((dimension) => (
          <SortableItem key={dimension.id} id={dimension.id}>
            <DimensionCard
              dimension={dimension}
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
