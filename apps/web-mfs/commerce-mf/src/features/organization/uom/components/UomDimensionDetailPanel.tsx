import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers, Pencil, Ruler, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDeleteUomDimension, useUomDimension } from '@/hooks/organization/uom-dimensions';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { EditUomDimensionDialog } from '../forms/EditUomDimensionDialog';
import { UomDimensionDetailPanelSkeleton } from './UomDimensionDetailPanelSkeleton';
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
      <DetailHeader
        title={dimension.name}
        badges={
          <Badge variant="outline" className="font-mono">
            {dimension.code}
          </Badge>
        }
        actions={
          <>
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
          </>
        }
      />

      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Description" type="string" value={dimension.description} />
        </DetailSection>
      </div>

      <Typography variant="overline" intent="muted" className="mb-3">
        Units
      </Typography>
      <UomTable dimensionId={dimension.id} />

      <Dialog
        handle={editDialog}
        icon={Layers}
        title="Edit Dimension"
        description="Update this UOM dimension."
        content={(close) => <EditUomDimensionDialog dimension={dimension} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
