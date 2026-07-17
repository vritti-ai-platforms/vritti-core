import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { PartyAddressResponseDto } from './party-address-response.dto';

export class PartyAddressTableResponseDto extends TableResponseDto<PartyAddressResponseDto> {
  @ApiProperty({ type: [PartyAddressResponseDto] })
  declare result: PartyAddressResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
