import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PartyBankAccountResponseDto } from './party-bank-account-response.dto';

export class PartyBankAccountTableResponseDto extends TableResponseDto<PartyBankAccountResponseDto> {
  @ApiProperty({ type: [PartyBankAccountResponseDto] })
  declare result: PartyBankAccountResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
