import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import type React from 'react';
import type { InventoryLedgerData } from '@/schemas/inventory-items';

interface LedgerTabProps {
  ledger: InventoryLedgerData[];
  uomSymbol: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  GOODS_RECEIPT: 'Goods Receipt',
  ORDER_RESERVE: 'Order Reserve',
  ORDER_DEDUCT: 'Order Deduct',
  ORDER_CANCEL: 'Order Cancel',
  ADJUSTMENT: 'Adjustment',
  CONVERSION_INPUT: 'Conversion Input',
  CONVERSION_OUTPUT: 'Conversion Output',
  TRANSFER_OUT: 'Transfer Out',
  TRANSFER_IN: 'Transfer In',
};

export const LedgerTab: React.FC<LedgerTabProps> = ({ ledger, uomSymbol }) => {
  if (ledger.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No ledger entries yet. Entries are created automatically when stock changes.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Quantity</th>
                <th className="pb-2 font-medium text-right">Balance</th>
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => {
                const isPositive = entry.quantity > 0;
                return (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                    </td>
                    <td className={`py-3 text-right font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}{entry.quantity} {uomSymbol}
                    </td>
                    <td className="py-3 text-right font-mono">{entry.balanceAfter} {uomSymbol}</td>
                    <td className="py-3 text-muted-foreground">{entry.referenceType ?? '—'}</td>
                    <td className="py-3 text-muted-foreground">{entry.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
