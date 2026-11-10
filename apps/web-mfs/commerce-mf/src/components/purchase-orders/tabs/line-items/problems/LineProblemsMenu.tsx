import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { TriangleAlert } from 'lucide-react';
import type React from 'react';
import type { PurchaseOrderProblem } from '@/schemas/purchase-orders';
import { ProblemDetail } from './ProblemDetail';

interface LineProblemsMenuProps {
  itemName: string;
  problems: PurchaseOrderProblem[];
  onOpen: (problem: PurchaseOrderProblem) => void;
}

// A line's flags behind one count — it opens to what its receipts and invoices found, each row opening its document
export const LineProblemsMenu: React.FC<LineProblemsMenuProps> = ({ itemName, problems, onOpen }) => {
  const count = pluralize('problem', problems.length, true);
  const toMenuItem = (problem: PurchaseOrderProblem, index: number): MenuItem => ({
    type: 'custom',
    id: `${problem.source}-${index}`,
    asMenuItem: true,
    render: <ProblemDetail problem={problem} />,
    onClick: () => onOpen(problem),
  });

  return (
    <DropdownMenu
      align="end"
      contentClassName="max-h-96 w-96 overflow-y-auto"
      trigger={{
        children: (
          <Button variant="ghost" size="xs" aria-label={`${count} on ${itemName}`}>
            <Badge variant="warning">
              <TriangleAlert />
              {problems.length}
            </Badge>
          </Button>
        ),
      }}
      items={[
        {
          type: 'custom',
          id: 'heading',
          render: (
            <div className="flex flex-col px-2 py-1.5">
              <span className="font-medium text-sm">{itemName}</span>
              <span className="text-muted-foreground text-xs">{count} to review — none of them blocks the order</span>
            </div>
          ),
        },
        { type: 'separator' },
        {
          type: 'group',
          id: 'receiving',
          label: 'Receiving',
          items: problems.filter((problem) => problem.source === 'GOODS_RECEIPT').map(toMenuItem),
        },
        { type: 'separator' },
        {
          type: 'group',
          id: 'invoices',
          label: 'Invoices',
          items: problems.filter((problem) => problem.source === 'SUPPLIER_INVOICE').map(toMenuItem),
        },
      ]}
    />
  );
};
