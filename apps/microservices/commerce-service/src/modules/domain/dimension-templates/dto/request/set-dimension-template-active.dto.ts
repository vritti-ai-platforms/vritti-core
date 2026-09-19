import { IsBoolean, IsUUID } from 'class-validator';

export class SetDimensionTemplateActiveDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  isActive: boolean;
}
