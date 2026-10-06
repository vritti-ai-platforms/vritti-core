import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { BankAccountDto } from '../entity/bank-account.dto';

export class BankAccountsTableResponseDto extends TableResponseDto<BankAccountDto> {
  @ApiProperty({ type: [BankAccountDto] })
  declare result: BankAccountDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
