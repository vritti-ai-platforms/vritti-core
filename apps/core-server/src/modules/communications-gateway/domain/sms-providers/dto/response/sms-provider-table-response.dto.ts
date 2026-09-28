import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SmsProviderResponseDto } from './sms-provider-response.dto';

export class SmsProviderTableResponseDto extends TableResponseDto<SmsProviderResponseDto> {
  @ApiProperty({ type: [SmsProviderResponseDto] })
  declare result: SmsProviderResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
