import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyBankAccountResponseDto {
  @ApiProperty({ description: 'Bank account ID' })
  id: string;

  @ApiProperty({ description: 'The party ID' })
  partyId: string;

  @ApiProperty({ description: 'Account holder name', example: 'Acme Traders' })
  accountName: string;

  @ApiProperty({ description: 'Bank account number', example: '50100123456789' })
  accountNumber: string;

  @ApiPropertyOptional({ description: 'IFSC code', example: 'HDFC0001234', nullable: true })
  ifscCode: string | null;

  @ApiPropertyOptional({ description: 'UPI ID', example: 'acme@upi', nullable: true })
  upiId: string | null;

  @ApiPropertyOptional({ description: 'Bank name', example: 'HDFC Bank', nullable: true })
  bankName: string | null;

  @ApiProperty({ description: 'Whether this is the primary account for the party' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
