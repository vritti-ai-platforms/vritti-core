import { Badge } from '@vritti/quantum-ui/Badge';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type React from 'react';
import { usePurchaseSettings } from '@/hooks/site/purchases';

// The purchasing rules the legal entity set for the site, only those switched on
export const PurchasingRulesBadges: React.FC = () => {
  const { data: settings } = usePurchaseSettings();
  if (!settings) return null;
  return (
    <div className="flex items-center gap-2">
      {settings.supplierItemsRequired && (
        <Tooltip content="This site buys an item only from suppliers that have it set up here; the legal entity sets this.">
          <Badge variant="info">Supplier items required</Badge>
        </Tooltip>
      )}
      {settings.updateSupplierItemsFromOrders && (
        <Tooltip content="A sent order sets up the supplier items it orders here, with the price it paid.">
          <Badge variant="secondary">Orders update supplier items</Badge>
        </Tooltip>
      )}
    </div>
  );
};
