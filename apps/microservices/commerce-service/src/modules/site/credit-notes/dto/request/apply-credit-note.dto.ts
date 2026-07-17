import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class ApplyCreditNoteDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
