import { Button } from '@vritti/quantum-ui/Button';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import type { TaxGroupFormData, TaxRateFormData } from '@/schemas/tax-groups';

const defaultTaxRate: TaxRateFormData = { name: '', rate: 0, type: 'exclusive' };

const taxRateTypeOptions = [
  { value: 'exclusive', label: 'Exclusive' },
  { value: 'inclusive', label: 'Inclusive' },
];

interface TaxGroupFormProps {
  form: UseFormReturn<TaxGroupFormData>;
  showStatusFields?: boolean;
  compactRates?: boolean;
}

export function TaxGroupForm({ form, showStatusFields = false, compactRates = false }: TaxGroupFormProps) {
  const rateFields = useFieldArray({ control: form.control, name: 'taxRates' });

  return (
    <div className="space-y-4">
      <TextField name="name" label="Name" placeholder="e.g. GST 18%" />
      <Switch name="isDefault" label="Set as default tax group" />
      {showStatusFields && (
        <>
          <Switch name="isActive" label="Active" />
          <TextField name="sortOrder" type="number" label="Sort Order" placeholder="0" />
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Typography variant="body2" className="font-medium">
            Tax Rates
          </Typography>
          <Button type="button" variant="outline" size="sm" onClick={() => rateFields.append({ ...defaultTaxRate })}>
            <Plus className="mr-1 size-3" />
            Add Rate
          </Button>
        </div>

        {compactRates && (
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 pb-1">
            <Typography variant="caption" intent="muted" className="sm:col-span-5">
              Rate Name
            </Typography>
            <Typography variant="caption" intent="muted" className="sm:col-span-3">
              Rate (%)
            </Typography>
            <Typography variant="caption" intent="muted" className="sm:col-span-3">
              Type
            </Typography>
            <div className="sm:col-span-1" />
          </div>
        )}

        {rateFields.fields.map((field, index) => (
          <div key={field.id} className={`rounded-lg border ${compactRates ? 'p-2' : 'p-3'}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-12 items-start ${compactRates ? 'gap-1.5' : 'gap-2'}`}>
              <div className="sm:col-span-5">
                <TextField
                  name={`taxRates.${index}.name`}
                  label={compactRates ? undefined : 'Rate Name'}
                  placeholder="e.g. CGST"
                />
              </div>
              <div className="sm:col-span-3">
                <TextField
                  name={`taxRates.${index}.rate`}
                  type="number"
                  label={compactRates ? undefined : 'Rate (%)'}
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-3">
                <Select
                  name={`taxRates.${index}.type`}
                  label={compactRates ? undefined : 'Type'}
                  options={taxRateTypeOptions}
                />
              </div>
              <div
                className={
                  compactRates
                    ? 'sm:col-span-1 flex sm:justify-end sm:pt-2'
                    : 'sm:col-span-1 flex sm:justify-end sm:pt-7'
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => rateFields.remove(index)}
                  disabled={rateFields.fields.length <= 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
