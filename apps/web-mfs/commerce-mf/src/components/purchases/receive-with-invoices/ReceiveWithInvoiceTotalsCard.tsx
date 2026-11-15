import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { ReceiveWithInvoiceTotals } from './receiveWithInvoiceLines';

interface ReceiveWithInvoiceTotalsCardProps {
  totals: ReceiveWithInvoiceTotals;
  exchangeRate?: number | null;
}

// The invoice's subtotal, discount, tax and total, the total also in the legal entity's currency at a foreign rate
export const ReceiveWithInvoiceTotalsCard = ({ totals, exchangeRate }: ReceiveWithInvoiceTotalsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Totals</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <DetailField label="Subtotal" type="currency" value={totals.subtotal} />
        <DetailField label="Discount" type="currency" value={totals.discount} />
        <DetailField label="Tax" type="currency" value={totals.tax} />
        <DetailField label="Total" type="currency" value={totals.total} exchangeRate={exchangeRate} />
      </div>
    </CardContent>
  </Card>
);
