import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

export class PartySelectQueryDto extends SelectOptionsQueryDto {
  @IsUUID('7')
  partyId: string;
}
