import { IsBoolean, IsUUID } from 'class-validator';

export class SetDimensionTemplateActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
