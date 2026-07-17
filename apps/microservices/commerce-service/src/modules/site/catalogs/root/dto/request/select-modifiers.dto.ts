import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

export class SelectModifiersDto extends SelectOptionsQueryDto {
  @IsUUID()
  catalogId: string;
}
