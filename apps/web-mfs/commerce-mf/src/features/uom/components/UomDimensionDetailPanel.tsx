import { Button } from '@vritti/quantum-ui/Button';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDeleteUomDimension, useUomDimension } from '@/hooks/uom-dimensions';
import { EditUomDimensionDialog } from '../forms/EditUomDimensionDialog';
import { UomTable } from './UomTable';

interface UomDimensionDetailPanelProps {
  dimensionId: string;
  onDeleted: () => void;
}

export const UomDimensionDetailPanel: React.FC<UomDimensionDetailPanelProps> = ({ dimensionId, onDeleted }) => {
  const confirm = useConfirm();
  const editDialog = useDialog();
  const deleteMutation = useDeleteUomDimension();
  const { data: dimension, isLoading } = useUomDimension(dimensionId);

  const handleDelete = async () => {
    if (!dimension) return;
    const confirmed = await confirm({
      title: `Delete "${dimension.name}"?`,
      description: 'This dimension will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(dimension.id, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {dimension ? <Typography variant="h3">{dimension.name}</Typography> : <Skeleton className="h-8 w-48" />}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={editDialog.open}
            disabled={!dimension}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!dimension || !dimension.canDelete || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {dimension ? (
          <>
            <DetailField label="Code" value={<span className="font-mono">{dimension.code}</span>} />
            <DetailField label="Description" value={dimension.description ?? '—'} />
          </>
        ) : (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}
      </div>

      <div>
        <Typography variant="overline" intent="muted" className="mb-3">
          Units
        </Typography>
        <UomTable dimensionId={dimensionId} isLoading={isLoading} />
      </div>

      {dimension ? (
        <Dialog
          handle={editDialog}
          title="Edit Dimension"
          description="Update this UOM dimension."
          content={(close) => <EditUomDimensionDialog dimension={dimension} onSuccess={close} onCancel={close} />}
        />
      ) : null}
    </div>
  );
};
