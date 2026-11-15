import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { TriangleAlert } from 'lucide-react';
import type React from 'react';
import { type PurchaseOrderProblem, PurchaseOrderProblemSourceValues } from '@/schemas/purchase-orders';
import { ProblemDetail } from './ProblemDetail';

interface LineProblemsMenuProps {
  itemName: string;
  problems: PurchaseOrderProblem[];
  onOpen: (problem: PurchaseOrderProblem) => void;
}

// A line's problems behind one count — it opens to what its receipts flagged and the holds open on its invoices, each
// row opening its document
export const LineProblemsMenu: React.FC<LineProblemsMenuProps> = ({ itemName, problems, onOpen }) => {
  const count = pluralize('problem', problems.length, true);
  const blocking = problems.filter((problem) => problem.blocksPayment).length;
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
              <span className="text-muted-foreground text-xs">
                {blocking > 0
                  ? `${count} to review — ${pluralize('hold', blocking, true)} blocking payment`
                  : `${count} to review — none of them blocks the order`}
              </span>
            </div>
          ),
        },
        { type: 'separator' },
        {
          type: 'group',
          id: 'receiving',
          label: 'Receiving',
          items: problems
            .filter((problem) => problem.source === PurchaseOrderProblemSourceValues.GOODS_RECEIPT)
            .map(toMenuItem),
        },
        { type: 'separator' },
        {
          type: 'group',
          id: 'invoices',
          label: 'Invoice Holds',
          items: problems
            .filter((problem) => problem.source === PurchaseOrderProblemSourceValues.SUPPLIER_INVOICE)
            .map(toMenuItem),
        },
      ]}
    />
  );
};
