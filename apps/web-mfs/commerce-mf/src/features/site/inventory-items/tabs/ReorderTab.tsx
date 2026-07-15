import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil } from 'lucide-react';
import type React from 'react';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { EditReorderForm } from '../forms/EditReorderForm';

interface ReorderTabProps {
  item: InventoryItemData;
}

export const ReorderTab: React.FC<ReorderTabProps> = ({ item }) => {
  const editDialog = useDialog();
  const uom = item.uomSymbol ?? '';

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold">Reorder Configuration</h3>
          <Button
            variant="outline"
            size="sm"
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <DetailField
            label="Reorder Point"
            type="string"
            mono
            value={item.reorderPoint != null ? `${item.reorderPoint} ${uom}` : null}
          />
          <DetailField
            label="Max Stock Level"
            type="string"
            mono
            value={item.maxStockLevel != null ? `${item.maxStockLevel} ${uom}` : null}
          />
          <DetailField
            label="Safety Stock"
            type="string"
            mono
            value={item.safetyStock != null ? `${item.safetyStock} ${uom}` : null}
          />
        </div>
      </CardContent>

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Reorder Point"
        description="Update the reorder point for this item at the current site."
        content={(close) => (
          <EditReorderForm
            inventoryItemId={item.id}
            currentReorderPoint={item.reorderPoint}
            uomSymbol={item.uomSymbol}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </Card>
  );
};
