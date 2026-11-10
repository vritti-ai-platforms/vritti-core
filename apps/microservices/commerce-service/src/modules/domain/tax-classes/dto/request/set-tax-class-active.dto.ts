import { IsBoolean, IsUUID } from 'class-validator';

export class SetTaxClassActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
