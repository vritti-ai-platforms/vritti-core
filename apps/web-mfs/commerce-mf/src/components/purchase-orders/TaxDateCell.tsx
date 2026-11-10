import { DateCell } from '@vritti/quantum-ui/DataTable';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Lock } from 'lucide-react';
import type React from 'react';

interface TaxDateCellProps {
  date: string;
  overridden: boolean;
}

// A line's tax date, with a lock when the line sets its own — following the order's tax date is the norm worth no space
export const TaxDateCell: React.FC<TaxDateCellProps> = ({ date, overridden }) => (
  <span className="inline-flex items-center gap-1.5">
    <DateCell value={date} />
    {overridden && (
      <Tooltip content="Set for this line — the purchase order's tax date no longer applies">
        <Lock className="size-3 shrink-0 text-muted-foreground" />
      </Tooltip>
    )}
  </span>
);
