import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SortableDragHandle } from '@vritti/quantum-ui/Sortable';
import { GripVertical, MoreVertical, Pencil, Plus, SwatchBook, Trash2 } from 'lucide-react';
import type React from 'react';
import type { OfferingDimensionData } from '@/schemas/offerings';
import { DimensionValuesDialog } from '../forms/DimensionValuesDialog';
import { EditDimensionDialog } from '../forms/EditDimensionDialog';
import type { OfferingPermissions, UseUpdateDimension, UseUpsertDimensionValues } from '../types';

interface DimensionCardProps {
  permissions: OfferingPermissions;
  dimension: OfferingDimensionData;
  canEdit: boolean;
  useUpsertValues: UseUpsertDimensionValues;
  useUpdate: UseUpdateDimension;
  onDelete: (dimension: OfferingDimensionData) => void;
}

export const DimensionCard: React.FC<DimensionCardProps> = ({
  permissions,
  dimension,
  canEdit,
  useUpsertValues,
  useUpdate,
  onDelete,
}) => {
  // The card owns its values dialog, so the list above it holds no "which row is open" state
  const valuesDialog = useDialog();
  const editDialog = useDialog();
  const noValues = dimension.valueCount === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <SortableDragHandle className="mt-0.5 grid size-5 cursor-grab place-items-center rounded text-muted-foreground hover:bg-muted">
            <GripVertical className="size-3.5" />
          </SortableDragHandle>
          <div>
            <div className="flex items-center gap-2 font-medium">
              {dimension.name}
              <span className="font-mono text-muted-foreground text-xs">{dimension.code}</span>
            </div>
            {dimension.description ? (
              <span className="block text-muted-foreground text-xs">{dimension.description}</span>
            ) : null}
            <span className="text-muted-foreground text-xs">{pluralize('value', dimension.valueCount, true)}</span>
          </div>
        </div>
        <DropdownMenu
          trigger={{
            children: (
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                <MoreVertical className="size-4" />
              </Button>
            ),
          }}
          items={[
            {
              type: 'item',
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              hidden: !canEdit,
              permission: permissions.dimensions.edit,
              onClick: editDialog.open,
            },
            {
              type: 'item',
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              hidden: !canEdit,
              permission: permissions.dimensions.delete,
              disabled: !dimension.canDelete,
              onClick: () => onDelete(dimension),
            },
          ]}
        />
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {noValues ? (
          <Button
            variant="outline"
            size="sm"
            onClick={valuesDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={permissions.dimensions.edit}
          >
            Add values
          </Button>
        ) : (
          <>
            {dimension.values.map((value) => (
              <span
                key={value.id}
                className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-sm"
              >
                {value.value}
                <span className="font-mono text-muted-foreground text-xs">{value.code}</span>
              </span>
            ))}
            {canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground text-xs"
                startAdornment={<Pencil className="size-3" />}
                permission={permissions.dimensions.edit}
                onClick={valuesDialog.open}
              >
                Edit
              </Button>
            ) : null}
          </>
        )}
      </CardContent>

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Dimension"
        description={dimension.code}
        content={(close) => (
          <EditDimensionDialog useUpdate={useUpdate} dimension={dimension} onSuccess={close} onCancel={close} />
        )}
      />

      <Dialog
        handle={valuesDialog}
        icon={SwatchBook}
        title={noValues ? 'Add Values' : 'Edit Values'}
        description="Each value becomes a segment of a derived SKU. Values already used by a variant cannot be deleted."
        content={(close) => (
          <DimensionValuesDialog dimension={dimension} useUpsert={useUpsertValues} onSuccess={close} onCancel={close} />
        )}
      />
    </Card>
  );
};
