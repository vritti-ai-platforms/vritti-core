import { Alert } from '@vritti/quantum-ui/Alert';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import type { PurchaseOrderProblem } from '@/schemas/purchase-orders';
import { ProblemDetail } from './ProblemDetail';

interface OrderProblemsAlertProps {
  problems: PurchaseOrderProblem[];
  onOpen: (problem: PurchaseOrderProblem) => void;
}

// The flags no single line carries — an invoice billed at another rate than the order's — each opening its document
export const OrderProblemsAlert: React.FC<OrderProblemsAlertProps> = ({ problems, onOpen }) => (
  <Alert
    variant="warning"
    title={`${pluralize('problem', problems.length, true)} on the whole order`}
    description={
      <div className="flex flex-col gap-3">
        {problems.map((problem) => (
          <ProblemDetail
            key={`${problem.documentId}-${problem.code}-${problem.lotNumber}`}
            problem={problem}
            onOpen={onOpen}
          />
        ))}
        <span>Flags are for review only; nothing on the order is blocked.</span>
      </div>
    }
  />
);
