import type { CurrencyAmountDto } from '@vritti/api-sdk';

export interface PurchaseOrderEmailItem {
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
  unitPrice: CurrencyAmountDto | null;
  totalPrice: CurrencyAmountDto | null;
}

export interface PurchaseOrderEmailData {
  poNumber: string | null;
  status: string;
  orderDate: string;
  expectedBy: string | null;
  notes: string | null;
  totalAmount: CurrencyAmountDto | null;
  items: PurchaseOrderEmailItem[];
}

export interface SupplierEmailData {
  name: string | null;
  email: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US');
}

// Returns a display string for a CurrencyAmountDto, e.g. "INR 99.99"
function formatAmount(value: CurrencyAmountDto | null): string {
  if (value == null) return '-';
  return `${value.currency} ${value.value}`;
}

// Returns numeric total from totalAmount or sums item totalPrices (same currency assumed)
function resolveTotalAmountDisplay(po: PurchaseOrderEmailData): string {
  if (po.totalAmount != null) return formatAmount(po.totalAmount);
  const currency = po.items.find((i) => i.totalPrice != null)?.totalPrice?.currency ?? '';
  const sum = po.items.reduce((acc, item) => acc + Number(item.totalPrice?.value ?? 0), 0);
  return currency ? `${currency} ${sum.toFixed(2)}` : '-';
}

export function buildPurchaseOrderEmailHtml(po: PurchaseOrderEmailData, supplier: SupplierEmailData): string {
  const totalAmountDisplay = resolveTotalAmountDisplay(po);
  const poNumber = escapeHtml(po.poNumber ?? '-');
  const supplierName = escapeHtml(supplier.name ?? '-');
  const notes = escapeHtml(po.notes ?? '-');
  const lineItems = po.items
    .map((item, index) => {
      const itemName = escapeHtml(item.inventoryItemName ?? item.inventoryItemId);
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${itemName}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatAmount(item.unitPrice)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatAmount(item.totalPrice)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 24px; background: #f9fafb;">
    <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
      <h2 style="margin: 0 0 16px;">Purchase Order ${poNumber}</h2>
      <p style="margin: 0 0 20px;">Please find the purchase order details below.</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px 0;"><strong>Supplier</strong></td>
          <td style="padding: 6px 0;">${supplierName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Status</strong></td>
          <td style="padding: 6px 0;">${escapeHtml(po.status)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Order Date</strong></td>
          <td style="padding: 6px 0;">${formatDate(po.orderDate)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Expected By</strong></td>
          <td style="padding: 6px 0;">${formatDate(po.expectedBy)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Notes</strong></td>
          <td style="padding: 6px 0;">${notes}</td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">#</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Ordered</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>${lineItems}</tbody>
      </table>

      <p style="margin: 0;"><strong>Total Amount:</strong> ${totalAmountDisplay}</p>
    </div>
  </body>
</html>
`.trim();
}

export function buildPurchaseOrderEmailText(po: PurchaseOrderEmailData, supplier: SupplierEmailData): string {
  const totalAmountDisplay = resolveTotalAmountDisplay(po);
  const itemLines = po.items
    .map((item, index) => {
      const itemName = item.inventoryItemName ?? item.inventoryItemId;
      return `${index + 1}. ${itemName} | Qty: ${item.quantity} | Unit: ${formatAmount(item.unitPrice)} | Total: ${formatAmount(item.totalPrice)}`;
    })
    .join('\n');

  return [
    `Purchase Order ${po.poNumber ?? '-'}`,
    '',
    `Supplier: ${supplier.name ?? '-'}`,
    `Status: ${po.status}`,
    `Order Date: ${formatDate(po.orderDate)}`,
    `Expected By: ${formatDate(po.expectedBy)}`,
    `Notes: ${po.notes ?? '-'}`,
    '',
    'Line Items:',
    itemLines || '-',
    '',
    `Total Amount: ${totalAmountDisplay}`,
  ].join('\n');
}
