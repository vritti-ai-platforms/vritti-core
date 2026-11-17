import { Badge } from '@vritti/quantum-ui/Badge';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { TriangleAlert } from 'lucide-react';
import type React from 'react';
import type { PurchaseItemProblem } from '@/schemas/purchases';

interface PurchaseItemProblemsProps {
  problems: PurchaseItemProblem[];
}

// What stops a purchase item being bought, behind one warning count that lists each on hover
export const PurchaseItemProblems: React.FC<PurchaseItemProblemsProps> = ({ problems }) => (
  <Tooltip
    content={
      <ul className="flex flex-col gap-1">
        {problems.map((problem) => (
          <li key={problem.code}>{problem.detail}</li>
        ))}
      </ul>
    }
  >
    <Badge variant="warning">
      <TriangleAlert />
      {problems.length}
    </Badge>
  </Tooltip>
);
