import { Badge } from '@vritti/quantum-ui/Badge';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { ModifierOptionData } from '@/schemas/items';

interface ModifierOptionRowProps {
  option: ModifierOptionData;
}

export const ModifierOptionRow: React.FC<ModifierOptionRowProps> = ({ option }) => {
  const price = Number.parseFloat(option.additionalPrice);

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Typography
          variant="body2"
          intent={option.isAvailable ? 'default' : 'muted'}
          className={option.isAvailable ? '' : 'line-through'}
        >
          {option.name}
        </Typography>
        {!option.isAvailable && (
          <Badge variant="outline" className="text-xs">
            Unavailable
          </Badge>
        )}
      </div>
      {price > 0 && (
        <Typography variant="body2" intent="muted">
          + ₹{price.toFixed(2)}
        </Typography>
      )}
    </div>
  );
};
