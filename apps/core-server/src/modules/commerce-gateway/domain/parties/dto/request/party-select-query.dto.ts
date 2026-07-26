import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsUUID } from 'class-validator';

export class PartySelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'The party whose records to fetch options for' })
  @IsUUID()
  partyId: string;
}
