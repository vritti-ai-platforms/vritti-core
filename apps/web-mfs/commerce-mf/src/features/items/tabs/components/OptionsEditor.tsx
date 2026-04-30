import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Layers, Plus } from 'lucide-react';
import type React from 'react';
import { UnsavedBar } from '@/components/UnsavedBar';
import type { ItemDetail } from '@/schemas/items';
import { useOptionsDraft } from '../../hooks/useOptionsDraft';
import { OptionRow } from './OptionRow';

interface OptionsEditorProps {
  item: ItemDetail;
}

export const OptionsEditor: React.FC<OptionsEditorProps> = ({ item }) => {
  const draft = useOptionsDraft(item);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="subtitle2">Options</Typography>
          <Typography variant="caption">
            Dimensions like Size or Color. Variants are created from every combination.
          </Typography>
        </div>
        {draft.options.length > 0 && (
          <Button variant="ghost" size="sm" onClick={draft.addOption} startAdornment={<Plus className="size-4" />}>
            Add option
          </Button>
        )}
      </div>

      {draft.options.length === 0 ? (
        <Empty
          icon={<Layers />}
          title="No options added"
          description="Add an option (Size, Color, etc.) to generate variants."
          action={
            <Button onClick={draft.addOption} startAdornment={<Plus className="size-4" />}>
              Add option
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {draft.options.map((option, index) => (
            <OptionRow
              key={index}
              index={index}
              option={option}
              onUpdateName={draft.updateName}
              onRemove={draft.removeOption}
              onAddValue={draft.addValue}
              onRemoveValue={draft.removeValue}
            />
          ))}
        </div>
      )}

      {draft.isDirty && (
        <UnsavedBar
          message={
            draft.previewVariantCount > 0
              ? `${draft.previewVariantCount} variant${draft.previewVariantCount === 1 ? '' : 's'} will be generated${
                  item.variants.length > 0 ? ', replacing existing variants' : ''
                }.`
              : 'Add a value to each option to generate variants.'
          }
          onCancel={draft.discardOptions}
          onSave={draft.applyOptions}
          isSaving={draft.isApplying}
          saveLabel="Apply"
          saveDisabled={draft.previewVariantCount === 0}
        />
      )}
    </div>
  );
};
