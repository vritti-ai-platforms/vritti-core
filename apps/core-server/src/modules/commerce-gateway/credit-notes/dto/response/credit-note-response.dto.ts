import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditNoteApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Credit note ID' })
  creditNoteId: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Applied amount' })
  amount: number;

  @ApiProperty({ description: 'ISO timestamp of application' })
  appliedAt: string;
}

export class CreditNoteResponseDto {
  @ApiProperty({ description: 'Credit note ID' })
  id: string;

  @ApiProperty({ description: 'Credit note type', enum: ['PAYABLE', 'RECEIVABLE'] })
  type: string;

  @ApiProperty({ description: 'Party type', enum: ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'] })
  partyType: string;

  @ApiPropertyOptional({ description: 'Party entity ID', nullable: true })
  partyId: string | null;

  @ApiProperty({ description: 'Party display name' })
  partyName: string;

  @ApiProperty({ description: 'Credit note number' })
  creditNoteNumber: string;

  @ApiProperty({ description: 'Total amount' })
  amount: number;

  @ApiProperty({ description: 'Amount applied to invoices' })
  appliedAmount: number;

  @ApiProperty({ description: 'Remaining balance' })
  remaining: number;

  @ApiPropertyOptional({ description: 'Reason for credit note', nullable: true })
  reason: string | null;

  @ApiProperty({ description: 'Credit note status', enum: ['DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED'] })
  status: string;

  @ApiPropertyOptional({ description: 'User ID of issuer', nullable: true })
  issuedBy: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}

export class CreditNoteDetailResponseDto extends CreditNoteResponseDto {
  @ApiProperty({ type: [CreditNoteApplicationResponseDto], description: 'Credit note applications' })
  applications: CreditNoteApplicationResponseDto[];
}
