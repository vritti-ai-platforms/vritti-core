import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCreditNoteDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  partyType: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partyName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  creditNoteNumber: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  issuedBy?: string;
}
