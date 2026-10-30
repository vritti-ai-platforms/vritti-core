import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplierItem } from '@/hooks/legal-entity/suppliers';
import { type SupplierItemData, type UpdateSupplierItemFormData, updateSupplierItemSchema } from '@/schemas/suppliers';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import { UomSelector } from '@/selectors/uom';

interface UpdateSupplierItemDialogProps {
  supplierId: string;
  item: SupplierItemData;
  // The item's prices are per its unit, so the unit is fixed once it is priced
  unitLocked?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdateSupplierItemDialog: React.FC<UpdateSupplierItemDialogProps> = ({
  supplierId,
  item,
  unitLocked = false,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierItemFormData>({
    resolver: zodResolver(updateSupplierItemSchema),
    defaultValues: {
      supplierItemCode: item.supplierItemCode ?? '',
      uomId: item.uomId,
      minOrderQuantity: item.minOrderQuantity ?? undefined,
      leadTimeDays: item.leadTimeDays ?? undefined,
    },
  });

  const updateMutation = useUpdateSupplierItem(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        itemId: item.id,
        data: {
          supplierItemCode: data.supplierItemCode ? data.supplierItemCode : null,
          uomId: data.uomId,
          minOrderQuantity: data.minOrderQuantity ?? null,
          leadTimeDays: data.leadTimeDays ?? null,
        },
      })}
    >
      <InventoryItemSelector
        label="Inventory Item"
        value={item.inventoryItemId}
        params={{ values: item.inventoryItemId }}
        disabled
      />
      <UomSelector
        name="uomId"
        label="Unit of Measure"
        placeholder="Select unit"
        params={{ inventoryItemId: item.inventoryItemId, supplierId }}
        disabled={unitLocked}
        description={unitLocked ? "Fixed once priced — the item's prices are per this unit" : undefined}
      />
      <TextField name="supplierItemCode" label="Supplier Item Code" placeholder="Supplier's code for this item" />
      <TextField
        name="minOrderQuantity"
        label="Min Order Qty (optional)"
        type="number"
        positive
        placeholder="e.g. 10"
        description="The least the supplier sells per order, in this unit"
      />
      <TextField
        name="leadTimeDays"
        label="Lead Time (days, optional)"
        type="number"
        integer
        positive
        placeholder="e.g. 5"
        description="Every site follows it unless the site sets its own"
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
