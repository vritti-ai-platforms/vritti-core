import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
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
