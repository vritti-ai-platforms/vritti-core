import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { CheckboxGroup } from '@vritti/quantum-ui/CheckboxGroup';
import { Empty } from '@vritti/quantum-ui/Empty';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tags } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { OfferingData, OfferingVariantData } from '@/schemas/offerings';
import { AttributesSkeleton } from '../components/AttributesSkeleton';
import type { OfferingPermissions, UseOfferingAttributes, UseSetVariantAttributes } from '../types';

interface AttributesTabProps {
  useAttributes: UseOfferingAttributes;
  useSetAttributes: UseSetVariantAttributes;
  permissions: OfferingPermissions;
  offering: OfferingData;
  variant: OfferingVariantData;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({
  useAttributes,
  useSetAttributes,
  permissions,
  offering,
  variant,
}) => {
  const { data: attributes = [], isLoading } = useAttributes(variant.offeringId);
  const setMutation = useSetAttributes();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(variant.attributeValues.map((entry) => entry.valueId)),
  );

  const saved = new Set(variant.attributeValues.map((entry) => entry.valueId));
  const isDirty = selected.size !== saved.size || [...selected].some((valueId) => !saved.has(valueId));

  // One CheckboxGroup per attribute, but `selected` is flat across all of them — the save replaces the
  // variant's whole set in one call. So a group reports its own values and only those are swapped out.
  const replaceOn = (groupValues: { id: string }[], ids: string[]) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const value of groupValues) next.delete(value.id);
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const header = (
    <div className="flex items-start justify-between gap-4">
      <p className="max-w-xl text-muted-foreground text-sm">
        Which of this product's attributes this variant carries. Any number of values applies at once, and none of them
        reach the SKU — a storefront turns them into filters.
      </p>
      <div className="flex flex-none gap-2">
        <Button variant="outline" onClick={() => setSelected(saved)} disabled={!isDirty || setMutation.isPending}>
          Reset
        </Button>
        <Button
          onClick={() => setMutation.mutate({ variantId: variant.id, valueIds: [...selected] })}
          disabled={!isDirty || !offering.canEdit}
          disabledTip={offering.canEdit ? undefined : 'This offering belongs to a wider scope.'}
          isLoading={setMutation.isPending}
          loadingText="Saving..."
          permission={permissions.variants.setAttributes}
        >
          Save Attributes
        </Button>
      </div>
    </div>
  );

  // An empty array reads the same whether the attributes are loading or genuinely absent, so the loading
  // branch has to come first or the empty state flashes on every visit
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <AttributesSkeleton />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          icon={<Tags />}
          title="No attributes to assign"
          description={`"${offering.name}" has no attributes yet. Add one on the product's Attributes tab, then pick its values here.`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      {attributes.map((attribute) => {
        const count = attribute.values.filter((value) => selected.has(value.id)).length;
        return (
          <Card key={attribute.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>{attribute.name}</CardTitle>
              <span className="font-mono text-muted-foreground text-xs">
                {count > 0 ? `${count} / ${attribute.values.length}` : 'none'}
              </span>
            </CardHeader>
            <CardContent>
              {attribute.values.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No values yet — add them on the product's Attributes tab.
                </p>
              ) : (
                <CheckboxGroup
                  columns={2}
                  disabled={!offering.canEdit}
                  options={attribute.values.map((value) => ({
                    value: value.id,
                    label: value.value,
                    description: value.code,
                  }))}
                  value={attribute.values.filter((value) => selected.has(value.id)).map((value) => value.id)}
                  onValueChange={(ids) => replaceOn(attribute.values, ids)}
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-muted-foreground text-sm">
        {selected.size === 0
          ? 'This variant carries no attributes.'
          : `This variant carries ${pluralize('attribute value', selected.size, true)}.`}
      </p>
    </div>
  );
};
