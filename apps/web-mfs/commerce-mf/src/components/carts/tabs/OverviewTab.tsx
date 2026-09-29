import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { CartData, CartLinesData } from '@/schemas/carts';

interface OverviewTabProps {
  cart: CartData;
  lines: CartLinesData;
  scopeNoun: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ cart, lines, scopeNoun }) => {
  const unavailable = lines.items.filter((line) => !line.isAvailable).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shopper</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField label="Name" type="string" value={cart.partyName} />
            <DetailField label="Opened" type="dateTime" value={cart.createdAt} />
            <DetailField label="Last changed" type="dateTime" value={cart.updatedAt} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField
              label="Status"
              type="string"
              value={
                cart.checkoutStartedAt ? (
                  <Badge variant="warning">In progress</Badge>
                ) : (
                  <Badge variant="secondary">Not started</Badge>
                )
              }
            />
            <DetailField label="Started" type="dateTime" value={cart.checkoutStartedAt} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Items</div>
            <div className="font-mono font-semibold text-2xl">{lines.items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Units</div>
            <div className="font-mono font-semibold text-2xl">{lines.itemCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Not sellable</div>
            <div className="font-mono font-semibold text-2xl">{unavailable}</div>
            <div className="text-muted-foreground text-xs">
              {unavailable === 0
                ? 'everything here can be bought'
                : `no longer priced by this ${scopeNoun}, or switched off`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
