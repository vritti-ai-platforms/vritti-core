import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

export class PartySelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID()
  partyId: string;
}
