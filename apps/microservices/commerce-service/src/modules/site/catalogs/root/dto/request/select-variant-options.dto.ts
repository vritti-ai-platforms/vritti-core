import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

export class SelectVariantOptionsDto extends SelectOptionsQueryDto {
  @IsUUID()
  catalogId: string;
}
