import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { CheckboxGroup } from '@vritti/quantum-ui/CheckboxGroup';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type BulkSetVariantsAttributeFormData,
  bulkSetVariantsAttributeSchema,
  type OfferingAttributeData,
  type OfferingVariantData,
} from '@/schemas/offerings';
import type { UseBulkSetVariantsAttribute } from '../types';

interface BulkSetVariantsAttributeDialogProps {
  useSet: UseBulkSetVariantsAttribute;
  offeringId: string;
  attributes: OfferingAttributeData[];
  variants: OfferingVariantData[];
  onSuccess: () => void;
  onCancel: () => void;
}

function carriedValueIds(variant: OfferingVariantData, attributeId: string): Set<string> {
  return new Set(
    variant.attributeValues.filter((entry) => entry.attributeId === attributeId).map((entry) => entry.valueId),
  );
}

// Everything ANY of the selected variants carries — the union, not the intersection. A save replaces the
// attribute, so the prefill decides what an unedited Save does: the union only ever adds, while the
// intersection silently strips. One untagged variant empties an intersection, which would have cleared
// the tag off every other variant in the selection without saying so.
function unionValueIds(variants: OfferingVariantData[], attributeId: string): string[] {
  if (!attributeId) return [];
  const union = new Set<string>();
  for (const variant of variants) {
    for (const valueId of carriedValueIds(variant, attributeId)) union.add(valueId);
  }
  return [...union];
}

function sameSet(carried: Set<string>, picked: string[]): boolean {
  return carried.size === picked.length && picked.every((valueId) => carried.has(valueId));
}

export const BulkSetVariantsAttributeDialog: React.FC<BulkSetVariantsAttributeDialogProps> = ({
  useSet,
  offeringId,
  attributes,
  variants,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<BulkSetVariantsAttributeFormData>({
    resolver: zodResolver(bulkSetVariantsAttributeSchema),
    defaultValues: { attributeId: '', valueIds: [] },
  });

  const setMutation = useSet({ onSuccess });
  const attributeId = useWatch({ control: form.control, name: 'attributeId' }) ?? '';
  const valueIds = useWatch({ control: form.control, name: 'valueIds' }) ?? [];
  const attribute = attributes.find((entry) => entry.id === attributeId);

  const union = useMemo(() => unionValueIds(variants, attributeId), [variants, attributeId]);

  // Values belong to one attribute, so switching attributes has to reset the picks — the server rejects
  // a value that is not on the named attribute, and this seeds the union in its place.
  // setValue rather than the whole form object: useForm returns a fresh object every render, so depending
  // on it would re-run this on every render and the useWatch above would re-render on each write.
  const { setValue } = form;
  useEffect(() => {
    setValue('valueIds', union);
  }, [union, setValue]);

  // Whether the selection already agrees, and how many rows this save would actually move. Both compare
  // whole sets rather than sizes, and `changing` tracks the live ticks so the count follows every edit.
  const carried = variants.map((variant) => carriedValueIds(variant, attributeId));
  const agrees = new Set(carried.map((set) => [...set].sort().join('|'))).size <= 1;
  const changing = carried.filter((set) => !sameSet(set, valueIds)).length;

  return (
    <Form
      form={form}
      mutation={setMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ offeringId, ids: variants.map((v) => v.id), attributeId, valueIds: data.valueIds })}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <Alert
          variant="default"
          title={`${pluralize('variant', variants.length, true)} will carry exactly what you pick`}
          description="Only this attribute changes — whatever these variants carry on their other attributes is left alone."
        />

        <Select
          name="attributeId"
          label="Attribute"
          placeholder="Select an attribute"
          options={attributes.map((entry) => ({ value: entry.id, label: entry.name }))}
        />

        {attribute && !agrees && (
          <Alert
            variant="warning"
            title={`The selection does not already agree on "${attribute.name}"`}
            description={`Ticked below is every value any of them carries, so nothing is dropped by accident. Saving applies exactly that set to all ${pluralize('variant', variants.length, true)}.`}
          />
        )}

        {attribute &&
          (attribute.values.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              "{attribute.name}" has no values yet. Add them on the product's Attributes tab first.
            </p>
          ) : (
            <CheckboxGroup
              label="Values"
              description="Every selected variant ends up carrying exactly what is ticked here."
              columns={2}
              options={attribute.values.map((value) => ({
                value: value.id,
                label: value.value,
                description: value.code,
              }))}
              value={valueIds}
              onValueChange={(ids) => setValue('valueIds', ids, { shouldDirty: true })}
              error={form.formState.errors.valueIds?.message}
            />
          ))}

        {/* What the save will actually do, recounted on every tick — the one number worth reading before
            pressing a button that rewrites several rows at once */}
        {attribute && attribute.values.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {changing === 0
              ? `Nothing to do — this is already set on ${pluralize('variant', variants.length, true)}.`
              : valueIds.length === 0
                ? `Nothing ticked — saving clears "${attribute.name}" from ${pluralize('variant', changing, true)}.`
                : `Saving changes ${pluralize('variant', changing, true)} of ${variants.length}.`}
          </p>
        )}
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" disabled={!attribute} loadingText="Applying...">
          Set Attribute
        </Button>
      </DialogActions>
    </Form>
  );
};
