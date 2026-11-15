import { buildSlug } from '@vritti/quantum-ui/slug';
import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import type { PurchaseLeg, PurchaseLegInvoice } from '@/schemas/purchases';
import { SupplierInvoiceStatusValues } from '@/schemas/supplier-invoices';

// The purchases feature's root under a workspace
export function purchasesPath(workspace: string): string {
  return `${workspace}/purchases`;
}

// A purchase's page, from the workspace root
export function purchasePath(workspace: string, purchase: { id: string; purchaseNumber: string }): string {
  return `${purchasesPath(workspace)}/${buildSlug(purchase.purchaseNumber, purchase.id)}`;
}

// A purchase order's page, from the workspace root
export function purchaseOrderPath(workspace: string, order: { id: string; poNumber: string }): string {
  return `${workspace}/purchase-orders/${buildSlug(order.poNumber, order.id)}`;
}

// An inbound delivery's page, from the workspace root
export function inboundDeliveryPath(workspace: string, delivery: { id: string; deliveryNumber: string }): string {
  return `${workspace}/inbound-deliveries/${buildSlug(delivery.deliveryNumber, delivery.id)}`;
}

// A goods receipt's page, from the workspace root; a receipt only known by its id opens by it
export function goodsReceiptPath(workspace: string, receipt: { id: string; grNumber?: string }): string {
  return `${workspace}/goods-receipts/${receipt.grNumber ? buildSlug(receipt.grNumber, receipt.id) : receipt.id}`;
}

// A Receive with Invoice's screen, from the workspace root; an invoice only known by its id opens by it
export function receiveWithInvoicePath(workspace: string, invoice: { id: string; invoiceNumber?: string }): string {
  return `${purchasesPath(workspace)}/receive-with-invoices/${invoice.invoiceNumber ? buildSlug(invoice.invoiceNumber, invoice.id) : invoice.id}`;
}

// A supplier invoice of a purchase's supplier: a draft Receive with Invoice opens on its screen, where it is edited until
// posted; any other invoice where the workspace keeps its invoices
export function purchaseInvoicePath(
  workspace: string,
  invoicePath: SupplierInvoicePath,
  invoice: PurchaseLegInvoice,
  supplier: Pick<PurchaseLeg, 'supplierId' | 'supplierName'>,
): string {
  return invoice.isReceiveWithInvoice && invoice.status === SupplierInvoiceStatusValues.DRAFT
    ? receiveWithInvoicePath(workspace, invoice)
    : `${workspace}/${invoicePath({ ...invoice, ...supplier })}`;
}
