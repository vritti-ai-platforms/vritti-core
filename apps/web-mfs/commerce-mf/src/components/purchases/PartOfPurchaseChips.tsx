import { Badge } from '@vritti/quantum-ui/Badge';
import { ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { PurchaseRef } from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import { purchasePath } from './documentPaths';

// "Part of PUR-…" chips linking a document to the purchases it belongs to; nothing for a manual document
export const PartOfPurchaseChips = ({ purchases }: { purchases: PurchaseRef[] }) => {
  const { pathname } = useLocation();
  const workspace = workspaceBase(pathname);
  return purchases.map((purchase) => (
    <Badge key={purchase.id} variant="outline" asChild>
      <Link to={purchasePath(workspace, purchase)}>
        <ShoppingCart className="size-3" />
        {`Part of ${purchase.purchaseNumber}`}
      </Link>
    </Badge>
  ));
};
