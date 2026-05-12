import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { UnsavedBar } from '@/components/UnsavedBar';
import type { ItemDetail } from '@/schemas/items';
import { useVariantEdits } from '../../hooks/useVariantEdits';
import { VariantRow } from './VariantRow';

interface VariantsEditorProps {
  item: ItemDetail;
}

export const VariantsEditor: React.FC<VariantsEditorProps> = ({ item }) => {
  const variants = useVariantEdits(item);

  if (item.variants.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Typography variant="subtitle2">Variants</Typography>
        <Typography variant="caption">
          {pluralize('variant', item.variants.length, true)} · Edit price and availability inline.
        </Typography>
      </div>

      <div className="overflow-hidden rounded-md border divide-y">
        {item.variants.map((variant) => {
          const edit = variants.edits.get(variant.id);
          if (!edit) return null;
          return (
            <VariantRow
              key={variant.id}
              variant={variant}
              edit={edit}
              isDirty={variants.dirtyIds.has(variant.id)}
              onFieldChange={variants.updateField}
              onDelete={variants.deleteVariant}
            />
          );
        })}
      </div>

      {variants.isDirty && (
        <UnsavedBar
          message={`${pluralize('unsaved change', variants.dirtyIds.size, true)}`}
          onCancel={variants.discardChanges}
          onSave={variants.saveChanges}
          isSaving={variants.isSaving}
        />
      )}
    </div>
  );
};
