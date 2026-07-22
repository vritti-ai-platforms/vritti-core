import { Badge } from '@vritti/quantum-ui/Badge';
import { Star } from 'lucide-react';
import type React from 'react';
import type { PartyFunctionResponse } from '@/schemas/party-functions';

interface FunctionChipsProps {
  functions: PartyFunctionResponse[];
  labels: Record<string, string>;
}

export const FunctionChips: React.FC<FunctionChipsProps> = ({ functions, labels }) => {
  if (!functions.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {functions.map((item) => (
        <Badge key={item.function} variant={'secondary'}>
          {item.isPrimary && <Star className="size-3 fill-current text-warning" />}
          {labels[item.function] ?? item.function}
        </Badge>
      ))}
    </div>
  );
};
