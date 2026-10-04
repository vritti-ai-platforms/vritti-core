import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class ApplyCreditNoteDto {
  @IsUUID('7')
  @IsNotEmpty()
  id: string;

  @IsUUID('7')
  @IsNotEmpty()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
