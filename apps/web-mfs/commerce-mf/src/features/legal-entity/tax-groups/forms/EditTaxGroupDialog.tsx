import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SortableDragHandle, SortableItem, SortableList } from '@vritti/quantum-ui/Sortable';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useUpdateTaxGroup } from '@/hooks/legal-entity/tax-groups';
import type { TaxGroupData, TaxGroupFormData } from '@/schemas/tax-groups';
import { taxGroupFormResolver } from '@/schemas/tax-groups';

interface EditTaxGroupDialogProps {
  group: TaxGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxGroupDialog: React.FC<EditTaxGroupDialogProps> = ({ group, onSuccess, onCancel }) => {
  const form = useForm<TaxGroupFormData>({
    resolver: taxGroupFormResolver,
    defaultValues: {
      name: group.name,
      isActive: group.isActive,
      taxRates: group.taxRates.map((rate) => ({
        name: rate.name,
        rate: rate.rate,
      })),
    },
  });

  const updateMutation = useUpdateTaxGroup({ onSuccess });
  const rateFields = useFieldArray({ control: form.control, name: 'taxRates' });
  const watchedRates = useWatch({ control: form.control, name: 'taxRates' });
  const combinedRate = (watchedRates ?? []).reduce((sum, rate) => sum + Number(rate?.rate || 0), 0);

  // Reorder the rate rows by drag, persisting live values in the new order.
  const handleReorder = (reordered: typeof rateFields.fields) => {
    const values = form.getValues('taxRates');
    const order = rateFields.fields.map((f) => f.id);
    rateFields.replace(reordered.map((item) => values[order.indexOf(item.id)]));
  };

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      className="flex max-h-[70vh] flex-col overflow-hidden"
      transformSubmit={(data) => ({
        id: group.id,
        data: {
          name: data.name,
          isActive: data.isActive,
          taxRates: data.taxRates.map((rate) => ({
            name: rate.name,
            rate: Number(rate.rate),
          })),
        },
      })}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <TextField name="name" label="Group Name" placeholder="e.g. GST 9%" />
        <Switch name="isActive" label="Active" description="Inactive tax groups won't apply to new invoices" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Typography variant="body2" className="font-medium">
                Tax Rates
              </Typography>
              <Badge variant="secondary">{rateFields.fields.length}</Badge>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => rateFields.append({ name: '', rate: 0 })}>
              <Plus className="mr-1 size-3" />
              Add Rate
            </Button>
          </div>

          <div className="flex items-center gap-1.5 px-2 pb-1">
            <div className="w-4" />
            <Typography variant="caption" intent="muted" className="flex-1">
              Rate Name
            </Typography>
            <Typography variant="caption" intent="muted" className="w-28">
              Rate (%)
            </Typography>
            <div className="w-8" />
          </div>

          <SortableList items={rateFields.fields} onReorder={handleReorder} className="space-y-2">
            {rateFields.fields.map((field, index) => (
              <SortableItem key={field.id} id={field.id} className="rounded-lg border p-2">
                <div className="flex items-start gap-1.5">
                  <div className="flex h-9 w-4 items-center justify-center">
                    <SortableDragHandle />
                  </div>
                  <div className="min-h-14 flex-1">
                    <TextField name={`taxRates.${index}.name`} placeholder="e.g. CGST" />
                  </div>
                  <div className="min-h-14 w-28">
                    <TextField name={`taxRates.${index}.rate`} type="number" placeholder="0" positive />
                  </div>
                  <div className="flex h-9 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => rateFields.remove(index)}
                      disabled={rateFields.fields.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableList>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{pluralize('rate', rateFields.fields.length, true)}</Badge>
              <Typography variant="body2" intent="muted">
                Combined rate
              </Typography>
            </div>
            <Typography variant="body2" className="text-primary font-semibold">
              {combinedRate.toFixed(2)}%
            </Typography>
          </div>
        </div>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
