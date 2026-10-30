import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Lock } from 'lucide-react';
import type React from 'react';

interface LeadTimeCellProps {
  days: number | null;
  // True when the site sets its own lead time instead of following the supplier item's
  overridden: boolean;
}

// A site's lead time, with a lock when the site pins its own — following the supplier item is the norm worth no space
export const LeadTimeCell: React.FC<LeadTimeCellProps> = ({ days, overridden }) => (
  <span className="inline-flex items-center gap-1.5">
    {days != null ? `${days} d` : '—'}
    {overridden && (
      <Tooltip content="Set for this site — the supplier item's lead time no longer applies">
        <Lock className="size-3 shrink-0 text-muted-foreground" />
      </Tooltip>
    )}
  </span>
);
