import { IsArray, IsUUID } from 'class-validator';

export class SaveItemModifiersDto {
  @IsUUID()
  itemId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  groupIds: string[];
}
