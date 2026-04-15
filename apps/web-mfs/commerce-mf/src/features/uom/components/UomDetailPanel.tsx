import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Plus, Ruler } from 'lucide-react';
import type React from 'react';
import { useDeleteUom } from '@/hooks/uom';
import type { UomData } from '@/schemas/uom';
import { AddDerivedUnitDialog } from '../forms/AddDerivedUnitDialog';
import { EditBaseUnitDialog } from '../forms/EditBaseUnitDialog';
import { DerivedUnitRow } from './DerivedUnitRow';

interface UomDetailPanelProps {
  baseUnit: UomData;
  derivedUnits: UomData[];
  isDerivedLoading: boolean;
  onBaseDeleted: () => void;
}

export const UomDetailPanel: React.FC<UomDetailPanelProps> = ({
  baseUnit,
  derivedUnits,
  isDerivedLoading,
  onBaseDeleted,
}) => {
  const confirm = useConfirm();
  const deleteMutation = useDeleteUom();

  const editBaseDialog = useDialog();
  const addDerivedDialog = useDialog();

  const handleDeleteBase = async () => {
    const confirmed = await confirm({
      title: `Delete "${baseUnit.name}"?`,
      description:
        derivedUnits.length > 0
          ? `This will also affect ${derivedUnits.length} derived unit(s). They will lose their base unit reference.`
          : 'This base unit will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(baseUnit.id, { onSuccess: onBaseDeleted });
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Typography variant="h3">{baseUnit.name}</Typography>
            <Badge variant="outline">{baseUnit.symbol}</Badge>
            <Badge variant="secondary">Base Unit</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={editBaseDialog.open}
              startAdornment={<Pencil className="size-3.5" />}
            >
              Edit
            </Button>
            <Button size="sm" onClick={addDerivedDialog.open} startAdornment={<Plus className="size-3.5" />}>
              Add Derived Unit
            </Button>
          </div>
        </div>

        {/* Derived units list */}
        <div>
          <Typography variant="overline" intent="muted" className="mb-4 block">
            Derived Units ({derivedUnits.length})
          </Typography>

          {isDerivedLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : derivedUnits.length === 0 ? (
            <Empty
              icon={<Ruler />}
              title="No derived units"
              description="Add a derived unit to define conversions"
              className="py-8 border rounded-lg"
            />
          ) : (
            <div className="space-y-2">
              {derivedUnits.map((unit) => (
                <DerivedUnitRow key={unit.id} unit={unit} baseUnitSymbol={baseUnit.symbol} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone — pinned to bottom */}
      <div className="shrink-0 p-6">
        <DangerZone
          title="Delete this base unit"
          description="This action cannot be undone. All derived units will lose their base unit reference."
          buttonText="Delete Base Unit"
          onClick={handleDeleteBase}
          disabled={!baseUnit.canDelete}
          warning={
            !baseUnit.canDelete
              ? 'This unit is referenced by inventory items, supplier items, or derived units and cannot be deleted.'
              : undefined
          }
        />
      </div>

      {/* Dialogs */}
      <Dialog
        handle={editBaseDialog}
        title="Edit Base Unit"
        description="Update the name and symbol for this base unit."
        content={(close) => <EditBaseUnitDialog unit={baseUnit} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={addDerivedDialog}
        title="Add Derived Unit"
        description={`Add a derived unit for ${baseUnit.name}.`}
        content={(close) => (
          <AddDerivedUnitDialog
            baseUnitId={baseUnit.id}
            baseUnitSymbol={baseUnit.symbol}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
