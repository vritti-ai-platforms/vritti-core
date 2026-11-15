import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderInvoiceSummaryResponseDto {
  @ApiProperty({ description: 'Invoices with a line invoicing the order, cancelled ones excluded' })
  invoiceCount: number;

  @ApiProperty({ description: 'Of those, the invoices with an open hold that blocks payment' })
  heldInvoiceCount: number;

  @ApiProperty({ description: "Invoiced and free quantity posted against the order's lines, in primary units" })
  invoicedPrimaryQty: number;

  @ApiProperty({ description: 'Ordered and free less cancelled over the lines, in primary units' })
  duePrimaryQty: number;

  @ApiProperty({ description: 'Invoiced as a percentage of due', example: 62.5 })
  invoicedPercent: number;
}
