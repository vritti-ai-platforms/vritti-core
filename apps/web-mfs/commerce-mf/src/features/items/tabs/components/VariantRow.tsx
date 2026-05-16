import { cn } from '@vritti/quantum-ui';
import { Button } from '@vritti/quantum-ui/Button';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Trash2 } from 'lucide-react';
import type React from 'react';
import type { ItemVariant } from '@/schemas/items';
import type { VariantEditState } from '../../hooks/useVariantEdits';

interface VariantRowProps {
  variant: ItemVariant;
  edit: VariantEditState;
  isDirty: boolean;
  onFieldChange: (variantId: string, field: keyof VariantEditState, value: string | boolean) => void;
  onDelete: (variant: ItemVariant) => void;
}

export const VariantRow: React.FC<VariantRowProps> = ({ variant, edit, isDirty, onFieldChange, onDelete }) => (
  <div
    className={cn('grid grid-cols-[1fr_120px_140px_56px_auto] items-center gap-3 px-3 py-2', isDirty && 'bg-warning/5')}
  >
    <div className="flex flex-col min-w-0">
      <Typography variant="subtitle2" className="truncate">
        {variant.name}
      </Typography>
      <Typography variant="caption" className="font-mono truncate">
        {variant.sku}
      </Typography>
    </div>

    <div className="flex items-center gap-1">
      <Typography variant="caption">₹</Typography>
      <TextField
        type="number"
        min={0}
        value={edit.price}
        onChange={(e) => onFieldChange(variant.id, 'price', e.target.value)}
        placeholder="0"
        className="h-8 w-24 px-2"
      />
    </div>

    <div className="flex items-center gap-2">
      <Switch
        checked={edit.isAvailable}
        onCheckedChange={(checked) => onFieldChange(variant.id, 'isAvailable', checked)}
      />
      <Typography variant="caption">{edit.isAvailable ? 'Available' : 'Unavailable'}</Typography>
    </div>

    <div />

    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive"
      onClick={() => onDelete(variant)}
      aria-label="Delete variant"
    >
      <Trash2 className="size-4" />
    </Button>
  </div>
);
