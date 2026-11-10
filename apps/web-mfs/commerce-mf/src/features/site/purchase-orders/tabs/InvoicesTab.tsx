import type React from 'react';
import { PurchaseOrderInvoicesTab } from '@/components/supplier-invoices/tabs/PurchaseOrderInvoicesTab';
import { invoicesBinding } from '../invoicesBinding';

interface InvoicesTabProps {
  purchaseOrderId: string;
}

// The order's invoices at the session site, on the order's page
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ purchaseOrderId }) => (
  <PurchaseOrderInvoicesTab binding={invoicesBinding} purchaseOrderId={purchaseOrderId} />
);
