import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { PartyBankAccountResponseDto } from './party-bank-account-response.dto';

export class PartyBankAccountTableResponseDto extends TableResponseDto<PartyBankAccountResponseDto> {
  @ApiProperty({ type: [PartyBankAccountResponseDto] })
  declare result: PartyBankAccountResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
