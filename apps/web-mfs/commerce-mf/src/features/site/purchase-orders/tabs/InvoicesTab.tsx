import type React from 'react';
import { PurchaseOrderInvoicesTab } from '@/components/supplier-invoices/tabs/PurchaseOrderInvoicesTab';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { invoicesBinding } from '../invoicesBinding';

interface InvoicesTabProps {
  purchaseOrder: PurchaseOrderDetail;
}

// The order's invoices at the session site, on the order's page
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ purchaseOrder }) => (
  <PurchaseOrderInvoicesTab binding={invoicesBinding} purchaseOrder={purchaseOrder} />
);
