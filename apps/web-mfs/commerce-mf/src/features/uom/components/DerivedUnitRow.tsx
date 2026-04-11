import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDeleteUom } from '@/hooks/uom';
import type { UomData } from '@/schemas/uom';
import { EditDerivedUnitDialog } from '../forms/EditDerivedUnitDialog';

interface DerivedUnitRowProps {
  unit: UomData;
  baseUnitSymbol: string;
}

export const DerivedUnitRow: React.FC<DerivedUnitRowProps> = ({ unit, baseUnitSymbol }) => {
  const confirm = useConfirm();
  const deleteMutation = useDeleteUom();
  const editDialog = useDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${unit.name}"?`,
      description: 'This unit will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(unit.id);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Typography variant="body2" className="font-medium truncate">
            {unit.name}
          </Typography>
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {unit.symbol}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Typography variant="caption" className="font-mono text-muted-foreground">
            x {unit.conversionFactor} {baseUnitSymbol}
          </Typography>
          <Button variant="ghost" size="icon" className="size-7" onClick={editDialog.open}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={!unit.canDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog
        handle={editDialog}
        title="Edit Derived Unit"
        description="Update the name, symbol, and conversion factor."
        content={(close) => (
          <EditDerivedUnitDialog unit={unit} baseUnitSymbol={baseUnitSymbol} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
