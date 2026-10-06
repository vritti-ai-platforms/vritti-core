import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { SortableDragHandle, SortableItem, SortableList } from '@vritti/quantum-ui/Sortable';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  type AttributeValuesFormData,
  attributeValuesSchema,
  type OfferingAttributeData,
  toCode,
} from '@/schemas/offerings';
import type { UseUpsertAttributeValues } from '../types';

interface AttributeValuesDialogProps {
  useUpsert: UseUpsertAttributeValues;
  attribute: OfferingAttributeData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AttributeValuesDialog: React.FC<AttributeValuesDialogProps> = ({
  useUpsert,
  attribute,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AttributeValuesFormData>({
    resolver: zodResolver(attributeValuesSchema),
    defaultValues: {
      values: attribute.values.length
        ? attribute.values.map((value) => ({ id: value.id, code: value.code, value: value.value }))
        : [{ code: '', value: '' }],
      templateId: null,
    },
  });

  const upsertMutation = useUpsert({ onSuccess });
  // keyName defaults to 'id', and react-hook-form strips the key property from submitted values —
  // which would eat the value id the server needs to tell a rename from a delete
  const valueFields = useFieldArray({ control: form.control, name: 'values', keyName: '_key' });
  const rows = useWatch({ control: form.control, name: 'values' });
  const lockedCodes = new Set(attribute.values.filter((value) => !value.canDelete).map((value) => value.code));

  // The code is what a storefront filters by and the name is what a person reads, so they are kept apart. Typing the
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
      transformSubmit={(data) => ({ attributeId: attribute.id, values: data.values })}
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
            <Button type="button" variant="ghost" size="sm" onClick={() => valueFields.append({ code: '', value: '' })}>
              <Plus className="mr-1 size-3" />
              Add value
            </Button>
          </div>
        </div>

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
                      placeholder="e.g. High Protein"
                      onChange={(event) => deriveCode(index, event.target.value)}
                    />
                  </div>
                  <div className="w-44">
                    <TextField name={`values.${index}.code`} placeholder="e.g. high-protein" />
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
