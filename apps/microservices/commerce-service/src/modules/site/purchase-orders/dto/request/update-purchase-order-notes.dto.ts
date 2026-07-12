import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseOrderNotesDto {
  @IsOptional()
  @IsString()
  notes?: string | null;
}
