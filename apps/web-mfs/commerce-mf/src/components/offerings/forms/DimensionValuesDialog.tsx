import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { CheckboxGroup } from '@vritti/quantum-ui/CheckboxGroup';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SortableDragHandle, SortableItem, SortableList } from '@vritti/quantum-ui/Sortable';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Plus, SwatchBook, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  type DimensionTemplateValueOption,
  type DimensionValuesFormData,
  dimensionValuesSchema,
  type OfferingDimensionData,
  toCode,
} from '@/schemas/offerings';
import { DimensionTemplateSelector } from '@/selectors/dimension-template';
import type { UseUpsertDimensionValues } from '../types';

interface DimensionValuesDialogProps {
  useUpsert: UseUpsertDimensionValues;
  dimension: OfferingDimensionData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DimensionValuesDialog: React.FC<DimensionValuesDialogProps> = ({
  useUpsert,
  dimension,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<DimensionValuesFormData>({
    resolver: zodResolver(dimensionValuesSchema),
    defaultValues: {
      values: dimension.values.length
        ? dimension.values.map((value) => ({ id: value.id, code: value.code, value: value.value }))
        : [{ code: '', value: '' }],
      templateId: null,
    },
  });

  const upsertMutation = useUpsert({ onSuccess });
  // keyName defaults to 'id', and react-hook-form strips the key property from submitted values —
  // which would eat the value id the server needs to tell a rename from a delete
  const valueFields = useFieldArray({ control: form.control, name: 'values', keyName: '_key' });
  const rows = useWatch({ control: form.control, name: 'values' });
  const lockedCodes = new Set(dimension.values.filter((value) => !value.canDelete).map((value) => value.code));

  const [copyOpen, setCopyOpen] = useState(false);
  const [offered, setOffered] = useState<DimensionTemplateValueOption[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const presentCodes = new Set((rows ?? []).map((row) => row?.code).filter(Boolean));
  const missing = offered.filter((option) => !presentCodes.has(option.code));

  // Appends the ticked template values, replacing the blank starter row rather than leaving it behind
  const addFromTemplate = () => {
    const additions = missing.filter((option) => picked.includes(option.code));
    if (additions.length === 0) return;
    const current = form.getValues('values');
    const blank = current.every((row) => !row.code && !row.value);
    valueFields[blank ? 'replace' : 'append'](additions.map((option) => ({ code: option.code, value: option.value })));
    form.setValue('templateId', null);
    setOffered([]);
    setPicked([]);
    setCopyOpen(false);
  };

  // The code is a SKU segment and the name is what a person reads, so they are kept apart. Typing the
  // name fills the code until the code is edited by hand.
  const deriveCode = (index: number, name: string) => {
    if (form.getFieldState(`values.${index}.code`).isDirty) return;
    form.setValue(`values.${index}.code`, toCode(name));
  };

  // SortableList identifies a row by `id`; the row's own id is optional, so it gets the stable form key
  const sortableItems = valueFields.fields.map((field) => ({ ...field, id: field._key }));

  // Reorder the value rows by drag, persisting live values in the new order.
  const handleReorder = (reordered: typeof sortableItems) => {
    const values = form.getValues('values');
    const order = sortableItems.map((item) => item.id);
    valueFields.replace(reordered.map((item) => values[order.indexOf(item.id)]));
  };

  return (
    <Form
      form={form}
      mutation={upsertMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ dimensionId: dimension.id, values: data.values })}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Typography variant="body2" className="font-medium">
              Values
            </Typography>
            <Badge variant="secondary">{valueFields.fields.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCopyOpen((open) => !open)}>
              <SwatchBook className="mr-1 size-3" />
              From template
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => valueFields.append({ code: '', value: '' })}>
              <Plus className="mr-1 size-3" />
              Add value
            </Button>
          </div>
        </div>

        {copyOpen && (
          <div className="space-y-3 rounded-lg bg-muted/40 p-3">
            <DimensionTemplateSelector
              name="templateId"
              placeholder="Pick a template"
              onOptionSelect={(option) => {
                const values = (option?.additionals?.values as DimensionTemplateValueOption[] | undefined) ?? [];
                setOffered(values);
                setPicked(values.filter((value) => !presentCodes.has(value.code)).map((value) => value.code));
              }}
            />

            {offered.length > 0 &&
              (missing.length === 0 ? (
                <Typography variant="caption" intent="muted">
                  Every value from that template is already here.
                </Typography>
              ) : (
                <>
                  <CheckboxGroup
                    columns={2}
                    options={missing.map((option) => ({ value: option.code, label: option.value }))}
                    value={picked}
                    onValueChange={setPicked}
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={addFromTemplate} disabled={!picked.length}>
                      Add {picked.length ? pluralize('value', picked.length, true) : 'values'}
                    </Button>
                  </div>
                </>
              ))}
          </div>
        )}

        <SortableList items={sortableItems} onReorder={handleReorder} className="space-y-2">
          {valueFields.fields.map((field, index) => {
            const inUse = lockedCodes.has(rows?.[index]?.code ?? '');
            return (
              <SortableItem key={field._key} id={field._key}>
                <div className="flex items-start gap-1.5">
                  <div className="flex h-9 w-4 items-center justify-center">
                    <SortableDragHandle />
                  </div>
                  <div className="flex-1">
                    <TextField
                      name={`values.${index}.value`}
                      placeholder="e.g. Onion & Garlic"
                      onChange={(event) => deriveCode(index, event.target.value)}
                    />
                  </div>
                  <div className="w-44">
                    <TextField name={`values.${index}.code`} placeholder="e.g. onion-garlic" />
                  </div>
                  <div className="flex h-9 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => valueFields.remove(index)}
                      disabled={inUse || valueFields.fields.length <= 1}
                      disabledTip={inUse ? 'Used by a variant' : undefined}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </SortableItem>
            );
          })}
        </SortableList>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Values
        </Button>
      </DialogActions>
    </Form>
  );
};
