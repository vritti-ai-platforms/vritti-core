import { IsBoolean, IsUUID } from 'class-validator';

export class SetAttributeTemplateActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
