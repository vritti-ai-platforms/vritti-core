import { IsBoolean, IsUUID } from 'class-validator';

export class SetTaxGroupActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
