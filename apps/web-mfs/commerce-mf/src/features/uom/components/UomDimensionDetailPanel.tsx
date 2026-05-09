import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Ruler, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDeleteUomDimension, useUomDimension } from '@/hooks/uom-dimensions';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { EditUomDimensionDialog } from '../forms/EditUomDimensionDialog';
import { UomTable } from './UomTable';

interface UomDimensionDetailPanelProps {
  dimensionId: string | null;
  onDeleted: () => void;
}

export const UomDimensionDetailPanel: React.FC<UomDimensionDetailPanelProps> = ({ dimensionId, onDeleted }) => {
  const { data: dimension, isLoading } = useUomDimension(dimensionId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!dimensionId && (isLoading || !dimension)}
      loadingContent={<UomDimensionDetailPanelSkeleton />}
      isEmpty={!dimensionId}
      emptyState={
        <Empty
          icon={<Ruler />}
          title="Pick a dimension"
          description="Select a dimension from the side panel to manage its units."
        />
      }
    >
      {dimension ? <UomDimensionDetailContent dimension={dimension} onDeleted={onDeleted} /> : null}
    </PageContentDetails>
  );
};

function UomDimensionDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-64" />
      </div>
    </div>
  );
}

interface UomDimensionDetailContentProps {
  dimension: UomDimensionData;
  onDeleted: () => void;
}

const UomDimensionDetailContent: React.FC<UomDimensionDetailContentProps> = ({ dimension, onDeleted }) => {
  const confirm = useConfirm();
  const editDialog = useDialog();
  const deleteMutation = useDeleteUomDimension();

  const handleDelete = async () => {
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
        <div className="flex items-center gap-3 flex-wrap">
          <Typography variant="h3">{dimension.name}</Typography>
          <Badge variant="outline" className="font-mono">
            {dimension.code}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={editDialog.open}
            disabled={!dimension.canEdit}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!dimension.canDelete || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <DetailField label="Description" value={dimension.description ?? '—'} />

      <Typography variant="overline" intent="muted" className="mb-3">
        Units
      </Typography>
      <UomTable dimensionId={dimension.id} />

      <Dialog
        handle={editDialog}
        title="Edit Dimension"
        description="Update this UOM dimension."
        content={(close) => <EditUomDimensionDialog dimension={dimension} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
