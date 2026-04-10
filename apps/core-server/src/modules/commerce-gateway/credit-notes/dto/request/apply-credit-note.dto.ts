import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class ApplyCreditNoteDto {
  @ApiProperty({ description: 'Invoice to apply credit note against' })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Amount to apply', example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
