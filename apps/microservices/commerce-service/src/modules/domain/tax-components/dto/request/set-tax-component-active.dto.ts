import { IsBoolean, IsUUID } from 'class-validator';

export class SetTaxComponentActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
