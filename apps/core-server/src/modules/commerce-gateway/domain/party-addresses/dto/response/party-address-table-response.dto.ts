import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PartyAddressResponseDto } from './party-address-response.dto';

export class PartyAddressTableResponseDto extends TableResponseDto<PartyAddressResponseDto> {
  @ApiProperty({ type: [PartyAddressResponseDto] })
  declare result: PartyAddressResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
