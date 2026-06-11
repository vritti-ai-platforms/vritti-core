import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { BookOpen, Layers, Lock, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDeleteVariantOption, useVariantOptions } from '@/hooks/variant-options';
import type { VariantOption } from '@/schemas/variant-options';
import { VariantOptionDialog } from '../../forms/options/VariantOptionDialog';

interface VariantOptionDetailPanelProps {
  catalogId: string;
  optionId: string | null;
  onDeleted: () => void;
}

export const VariantOptionDetailPanel: React.FC<VariantOptionDetailPanelProps> = ({
  catalogId,
  optionId,
  onDeleted,
}) => {
  const { data: options = [], isLoading } = useVariantOptions(catalogId);
  const option = options.find((item) => item.id === optionId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!optionId && (isLoading || !option)}
      loadingContent={<VariantOptionDetailSkeleton />}
      isEmpty={!optionId}
      emptyState={
        <Empty
          icon={<Layers />}
          title="Pick an option"
          description="Select a variant option from the side panel to view its values."
        />
      }
    >
      {option ? <VariantOptionDetailContent catalogId={catalogId} option={option} onDeleted={onDeleted} /> : null}
    </PageContentDetails>
  );
};

function VariantOptionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

interface VariantOptionDetailContentProps {
  catalogId: string;
  option: VariantOption;
  onDeleted: () => void;
}

const VariantOptionDetailContent: React.FC<VariantOptionDetailContentProps> = ({ catalogId, option, onDeleted }) => {
  const confirm = useConfirm();
  const editDialog = useDialog();
  const deleteMutation = useDeleteVariantOption();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete option?',
      description: `Delete "${option.name}"? It is shared across offerings — those varying along it will be affected. Deletion is blocked while any value is in use.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate({ catalogId, optionId: option.id }, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Typography variant="h3">{option.name}</Typography>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={editDialog.open}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div>
        <Typography variant="overline" intent="muted" className="mb-3">
          Values
        </Typography>
        <div className="flex flex-wrap gap-2">
          {option.values.map((value) =>
            value.referenced ? (
              <Badge
                key={value.id}
                variant="secondary"
                className="gap-1"
                title="In use by a variant — can't be removed"
              >
                <Lock className="size-3" />
                {value.value}
              </Badge>
            ) : (
              <Badge key={value.id} variant="outline">
                {value.value}
              </Badge>
            ),
          )}
        </div>
      </div>

      <Dialog
        handle={editDialog}
        icon={BookOpen}
        title="Edit option"
        description={`Update "${option.name}" and its values.`}
        content={(close) => (
          <VariantOptionDialog catalogId={catalogId} option={option} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
