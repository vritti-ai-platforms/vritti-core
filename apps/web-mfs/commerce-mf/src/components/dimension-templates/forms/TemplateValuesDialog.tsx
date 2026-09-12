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
import { useFieldArray, useForm } from 'react-hook-form';
import { useUpsertDimensionTemplateValues } from '@/hooks/organization/dimension-templates';
import {
  type DimensionTemplateData,
  type DimensionTemplateValuesFormData,
  dimensionTemplateValuesSchema,
} from '@/schemas/dimension-templates';
import { toCode } from '@/schemas/offerings';

interface TemplateValuesDialogProps {
  template: DimensionTemplateData;
  onSuccess: () => void;
  onCancel: () => void;
}

// One form for both adding the first values and editing an existing set — the endpoint takes the
// whole set either way, so there is nothing to branch on.
export const TemplateValuesDialog: React.FC<TemplateValuesDialogProps> = ({ template, onSuccess, onCancel }) => {
  const form = useForm<DimensionTemplateValuesFormData>({
    resolver: zodResolver(dimensionTemplateValuesSchema),
    defaultValues: {
      values: template.values.length
        ? template.values.map((value) => ({ code: value.code, value: value.value }))
        : [{ code: '', value: '' }],
    },
  });

  const upsertMutation = useUpsertDimensionTemplateValues({ onSuccess });
  const valueFields = useFieldArray({ control: form.control, name: 'values' });

  // Typing the name fills the code until the code is edited by hand — the code is copied onto every
  // offering that seeds from this template and ends up in their SKUs, so it is worth getting right.
  const deriveCode = (index: number, name: string) => {
    if (form.getFieldState(`values.${index}.code`).isDirty) return;
    form.setValue(`values.${index}.code`, toCode(name));
  };

  // Reorder the value rows by drag, persisting live values in the new order.
  const handleReorder = (reordered: typeof valueFields.fields) => {
    const values = form.getValues('values');
    const order = valueFields.fields.map((field) => field.id);
    valueFields.replace(reordered.map((item) => values[order.indexOf(item.id)]));
  };

  return (
    <Form
      form={form}
      mutation={upsertMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ templateId: template.id, values: data.values })}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Typography variant="body2" className="font-medium">
                Values
              </Typography>
              <Badge variant="secondary">{valueFields.fields.length}</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => valueFields.append({ code: '', value: '' })}
            >
              <Plus className="mr-1 size-3" />
              Add Value
            </Button>
          </div>

          <div className="flex items-center gap-1.5 px-2 pb-1">
            <div className="w-4" />
            <Typography variant="caption" intent="muted" className="flex-1">
              Name
            </Typography>
            <Typography variant="caption" intent="muted" className="w-44">
              Code — becomes a SKU segment
            </Typography>
            <div className="w-8" />
          </div>

          <SortableList items={valueFields.fields} onReorder={handleReorder} className="space-y-2">
            {valueFields.fields.map((field, index) => (
              <SortableItem key={field.id} id={field.id} className="rounded-lg border p-2">
                <div className="flex items-start gap-1.5">
                  <div className="flex h-9 w-4 items-center justify-center">
                    <SortableDragHandle />
                  </div>
                  <div className="min-h-14 flex-1">
                    <TextField
                      name={`values.${index}.value`}
                      placeholder="e.g. Onion & Garlic"
                      onChange={(event) => deriveCode(index, event.target.value)}
                    />
                  </div>
                  <div className="min-h-14 w-44">
                    <TextField name={`values.${index}.code`} placeholder="e.g. onion-garlic" />
                  </div>
                  <div className="flex h-9 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => valueFields.remove(index)}
                      disabled={valueFields.fields.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableList>
        </div>
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
