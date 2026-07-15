import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItem } from '@/hooks/organization/inventory-items';
import {
  type CreateOrgInventoryItemFormData,
  createOrgInventoryItemSchema,
  inventoryItemTypeOptions,
} from '@/schemas/inventory-items';

interface AddInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const trackingOptions = [
  { value: 'quantity', label: 'Quantity — bulk fungible (e.g. office supplies)' },
  { value: 'lot', label: 'Lot — batch identity (mfg/expiry, lot #)' },
  { value: 'serial', label: 'Serial — per unit, no batch (e.g. IT assets, tools)' },
  { value: 'lot_serial', label: 'Lot + Serial — per unit within batch (e.g. pharma)' },
];

const pickStrategyOptions = [
  { value: 'none', label: 'None — free pick' },
  { value: 'fifo', label: 'FIFO — oldest received first' },
  { value: 'fefo', label: 'FEFO — nearest expiry first' },
];

export const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateOrgInventoryItemFormData>({
    resolver: zodResolver(createOrgInventoryItemSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'RAW_MATERIAL',
      tracking: 'lot',
      pickStrategy: 'none',
      categoryId: '',
      description: '',
      uomId: '',
      hsnCode: '',
      hasMrp: false,
      mrpUomId: undefined,
      mrpUomConversion: { uomQty: 1, primaryUomQty: 1 },
    },
  });

  const [primaryUom, setPrimaryUom] = useState<{ id?: string; baseUnitId?: string | null; symbol?: string }>({});
  const [mrpUom, setMrpUom] = useState<{ id?: string; baseUnitId?: string | null; symbol?: string }>({});
  const tracking = useWatch({ control: form.control, name: 'tracking' });
  const hasMrp = useWatch({ control: form.control, name: 'hasMrp' });
  const conversion = useWatch({ control: form.control, name: 'mrpUomConversion' });
  const needsMrpConversion =
    hasMrp &&
    !!primaryUom.id &&
    !!mrpUom.id &&
    (primaryUom.baseUnitId ?? primaryUom.id) !== (mrpUom.baseUnitId ?? mrpUom.id);
  const createMutation = useCreateInventoryItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...data,
        mrpUomId: data.hasMrp ? data.mrpUomId : undefined,
        mrpUomConversion: needsMrpConversion ? data.mrpUomConversion : undefined,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector
              name="uomId"
              label="Unit of Measure"
              placeholder="Select unit"
              fieldKeys={{
                valueKey: 'id',
                labelKey: 'name',
                groupIdKey: 'dimensionId',
                additionalKeys: 'symbol,baseUnitId',
              }}
              onOptionSelect={(o) =>
                setPrimaryUom({
                  id: o?.value as string,
                  baseUnitId: (o?.additionals?.baseUnitId as string | null) ?? null,
                  symbol: o?.additionals?.symbol as string,
                })
              }
            />
            <div className="col-span-2">
              <CategorySelector name="categoryId" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Tracking" contentClassName="block">
          <div className="grid grid-cols-2 gap-6">
            <RadioGroup name="tracking" label="Tracking Method" options={trackingOptions} />
            {tracking !== 'quantity' && (
              <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
            )}
          </div>
        </FormSection>

        <FormSection title="MRP & Compliance" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
            <div className="col-span-2">
              <Switch
                name="hasMrp"
                label="Tracks MRP"
                description="Enable to capture a printed MRP on this item and its stock."
              />
            </div>
            {hasMrp && (
              <>
                <UomSelector
                  name="mrpUomId"
                  label="MRP Unit"
                  placeholder="Select unit"
                  fieldKeys={{
                    valueKey: 'id',
                    labelKey: 'name',
                    groupIdKey: 'dimensionId',
                    additionalKeys: 'symbol,baseUnitId',
                  }}
                  onOptionSelect={(o) =>
                    setMrpUom({
                      id: o?.value as string,
                      baseUnitId: (o?.additionals?.baseUnitId as string | null) ?? null,
                      symbol: o?.additionals?.symbol as string,
                    })
                  }
                />
                {needsMrpConversion && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        name="mrpUomConversion.uomQty"
                        label={`Count of ${mrpUom.symbol ?? 'MRP unit'}`}
                        type="number"
                        integer
                        positive
                      />
                      <TextField
                        name="mrpUomConversion.primaryUomQty"
                        label={`Count of ${primaryUom.symbol ?? 'primary unit'}`}
                        type="number"
                        integer
                        positive
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conversion?.uomQty ?? 1} {mrpUom.symbol} = {conversion?.primaryUomQty ?? 1} {primaryUom.symbol}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </FormSection>

        <FormSection title="Notes" contentClassName="block">
          <TextArea name="description" label="Description" placeholder="Optional description" />
        </FormSection>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </DialogActions>
    </Form>
  );
};
